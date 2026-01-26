/**
 * Server side methods to connect to the database
 * Using Drizzle ORM
 */

import { eq, desc, sql } from "drizzle-orm";

import {
  ChartConfig,
  Config,
  ConfiguratorState,
  ConfiguratorStatePublished,
} from "@/config-types";
import { db } from "@/db/drizzle";
import {
  config,
  configView,
  Config as DbConfig,
  PublishedState,
  User,
} from "@/db/schema";
import { isDataSourceUrlAllowed } from "@/domain/data-source";
import { upgradeConfiguratorStateServerSide } from "@/utils/chart-config/upgrade-cube";
import { migrateConfiguratorState } from "@/utils/chart-config/versioning";

/**
 * Store data in the DB.
 * If the user is logged, the chart is linked to the user.
 *
 * @param key Key of the config to be stored
 * @param data Data to be stored as configuration
 */
export const createConfig = async ({
  key,
  data,
  userId,
  published_state,
}: {
  key: string;
  data: unknown;
  userId?: User["id"] | undefined;
  published_state: PublishedState;
}): Promise<{ key: string }> => {
  const [result] = await db
    .insert(config)
    .values({
      key,
      data,
      user_id: userId,
      published_state,
    })
    .returning({ key: config.key });

  return result;
};

/**
 * Update config in the DB.
 * Only valid for logged in users.
 *
 * @param key Key of the config to be updated
 * @param data Data to be stored as configuration
 */
export const updateConfig = async ({
  key,
  data,
  published_state,
}: {
  key: string;
  data: unknown;
  published_state: PublishedState;
}): Promise<{ key: string }> => {
  const [result] = await db
    .update(config)
    .set({
      data,
      updated_at: new Date(),
      published_state,
    })
    .where(eq(config.key, key))
    .returning({ key: config.key });

  return result;
};

/**
 * Remove config from the DB.
 * Only valid for logged in users.
 *
 * @param key Key of the config to be updated
 */
export const removeConfig = async ({ key }: { key: string }) => {
  // First delete all views referencing this config
  await db.delete(configView).where(eq(configView.config_key, key));

  // Then delete the config
  await db.delete(config).where(eq(config.key, key));
};

const migrateCubeIri = (iri: string): string => {
  if (iri.includes("https://environment.ld.admin.ch/foen/nfi")) {
    return iri.replace(/None-None-/, "");
  }

  return iri;
};

/** Ensure that filters are ordered by position */
const ensureFiltersOrder = (chartConfig: ChartConfig) => {
  return {
    ...chartConfig,
    cubes: chartConfig.cubes.map((cube) => {
      return {
        ...cube,
        filters: Object.fromEntries(
          Object.entries(cube.filters)
            .sort(([, a], [, b]) => {
              return (a.position ?? 0) - (b.position ?? 0);
            })
            .map(([k, v]) => {
              const { position, ...rest } = v;
              return [k, rest];
            })
        ),
      };
    }),
  };
};

/** Ensure that cube iris are migrated */
const ensureMigratedCubeIris = (chartConfig: ChartConfig) => {
  return {
    ...chartConfig,
    cubes: chartConfig.cubes.map((cube) => ({
      ...cube,
      iri: migrateCubeIri(cube.iri),
    })),
  };
};

const parseDbConfig = async (d: DbConfig) => {
  const data = d.data;
  const state = (await migrateConfiguratorState(
    data
  )) as ConfiguratorStatePublished;

  if (!isDataSourceUrlAllowed(state.dataSource.url)) {
    throw new Error("Invalid data source!");
  }

  return {
    ...d,
    data: {
      ...state,
      chartConfigs: state.chartConfigs
        .map(ensureFiltersOrder)
        .map(ensureMigratedCubeIris),
    },
  };
};

const upgradeDbConfig = async (parsedConfig: Awaited<ReturnType<typeof parseDbConfig>>) => {
  const state = parsedConfig.data as Config;
  const dataSource = state.dataSource;

  return {
    ...parsedConfig,
    data: await upgradeConfiguratorStateServerSide(state as ConfiguratorState, {
      dataSource,
    }),
  } as Awaited<ReturnType<typeof parseDbConfig>>;
};

/**
 * Get data from DB.
 *
 * @param key Get data from DB with this key
 */
export const getConfig = async (key: string) => {
  const [result] = await db
    .select()
    .from(config)
    .where(eq(config.key, key))
    .limit(1);

  if (!result) {
    return;
  }

  const dbConfig = await parseDbConfig(result);

  return await upgradeDbConfig(dbConfig);
};

/**
 * Get all configs from DB.
 */
export const getAllConfigs = async ({
  limit,
}: {
  limit?: number;
} = {}) => {
  let query = db.select().from(config).orderBy(desc(config.created_at));

  if (limit) {
    query = query.limit(limit) as typeof query;
  }

  const configs = await query;
  const parsedConfigs = await Promise.all(configs.map(parseDbConfig));

  return await Promise.all(parsedConfigs.map(upgradeDbConfig));
};

/** @internal */
export const getConfigViewCount = async (configKey: string) => {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(configView)
    .where(eq(configView.config_key, configKey));

  return result?.count ?? 0;
};

/**
 * Increase the view count of a config. Previewing of charts adds views without config key.
 */
export const increaseConfigViewCount = async (configKey?: string) => {
  await db.insert(configView).values({
    config_key: configKey,
  });
};

/**
 * Get all configs metadata from DB.
 */
export const getAllConfigsMetadata = async ({
  limit,
  orderByViewCount,
}: {
  limit?: number;
  orderByViewCount?: boolean;
} = {}) => {
  if (orderByViewCount) {
    // Order by view count requires a subquery
    const query = db
      .select({
        key: config.key,
        created_at: config.created_at,
        updated_at: config.updated_at,
        published_state: config.published_state,
        user_id: config.user_id,
        viewCount: sql<number>`(
          SELECT count(*)::int FROM config_view cv WHERE cv.config_key = config.key
        )`.as("view_count"),
      })
      .from(config)
      .orderBy(desc(sql`view_count`));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  let query = db
    .select({
      key: config.key,
      created_at: config.created_at,
      updated_at: config.updated_at,
      published_state: config.published_state,
      user_id: config.user_id,
    })
    .from(config)
    .orderBy(desc(config.created_at));

  if (limit) {
    query = query.limit(limit) as typeof query;
  }

  return await query;
};

/**
 * Get config from a user.
 */
export const getUserConfigs = async (userId: number) => {
  const configs = await db
    .select()
    .from(config)
    .where(eq(config.user_id, userId))
    .orderBy(desc(config.created_at));

  const parsedConfigs = await Promise.all(configs.map(parseDbConfig));
  const upgradedConfigs = await Promise.all(parsedConfigs.map(upgradeDbConfig));

  const configsWithViewCount = await Promise.all(
    upgradedConfigs.map(async (cfg) => {
      return {
        ...cfg,
        viewCount: await getConfigViewCount(cfg.key),
      };
    })
  );
  return configsWithViewCount;
};

export type ParsedConfig = Awaited<ReturnType<typeof parseDbConfig>>;
export type ParsedConfigWithViewCount = Awaited<
  ReturnType<typeof getUserConfigs>
>[number];
