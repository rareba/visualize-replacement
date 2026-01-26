/**
 * Drizzle ORM Schema
 * Replaces Prisma schema.prisma
 */
import {
  pgTable,
  serial,
  char,
  jsonb,
  timestamp,
  integer,
  varchar,
  text,
  pgEnum,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const publishedStateEnum = pgEnum("PUBLISHED_STATE", [
  "PUBLISHED",
  "ARCHIVED",
  "DRAFT",
]);

export const paletteTypeEnum = pgEnum("PALETTE_TYPE", [
  "SEQUENTIAL",
  "DIVERGING",
  "CATEGORICAL",
]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  sub: varchar("sub", { length: 64 }).unique(),
  name: varchar("name", { length: 100 }),
});

export const config = pgTable(
  "config",
  {
    id: serial("id").primaryKey(),
    key: char("key", { length: 12 }).unique().notNull(),
    data: jsonb("data").notNull(),
    created_at: timestamp("created_at", { precision: 6 }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { precision: 6 }).defaultNow().notNull(),
    user_id: integer("user_id").references(() => users.id),
    published_state: publishedStateEnum("published_state")
      .default("PUBLISHED")
      .notNull(),
  },
  (table) => ({
    dataGinIdx: index("config_data_idx").using("gin", table.data),
  })
);

export const configView = pgTable("config_view", {
  id: serial("id").primaryKey(),
  viewed_at: timestamp("viewed_at", { precision: 6 }).defaultNow().notNull(),
  config_key: char("config_key", { length: 12 }).references(() => config.key),
});

export const palettes = pgTable("palettes", {
  paletteId: uuid("paletteId").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  type: paletteTypeEnum("type").notNull(),
  colors: text("colors").array().notNull(),
  created_at: timestamp("created_at", { precision: 6 }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { precision: 6 }).defaultNow().notNull(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
});

export const migrations = pgTable("migrations", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  hash: varchar("hash", { length: 40 }).notNull(),
  executed_at: timestamp("executed_at", { precision: 6 }).defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  configs: many(config),
  palettes: many(palettes),
}));

export const configRelations = relations(config, ({ one, many }) => ({
  user: one(users, {
    fields: [config.user_id],
    references: [users.id],
  }),
  views: many(configView),
}));

export const configViewRelations = relations(configView, ({ one }) => ({
  config: one(config, {
    fields: [configView.config_key],
    references: [config.key],
  }),
}));

export const palettesRelations = relations(palettes, ({ one }) => ({
  user: one(users, {
    fields: [palettes.user_id],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Config = typeof config.$inferSelect;
export type NewConfig = typeof config.$inferInsert;

export type ConfigView = typeof configView.$inferSelect;
export type NewConfigView = typeof configView.$inferInsert;

export type Palette = typeof palettes.$inferSelect;
export type NewPalette = typeof palettes.$inferInsert;

export type PublishedState = "PUBLISHED" | "ARCHIVED" | "DRAFT";
export type PaletteType = "SEQUENTIAL" | "DIVERGING" | "CATEGORICAL";

// Enum-like const objects for use as values (matching Prisma's enum behavior)
export const PUBLISHED_STATE = {
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
  DRAFT: "DRAFT",
} as const;

export const PALETTE_TYPE = {
  SEQUENTIAL: "SEQUENTIAL",
  DIVERGING: "DIVERGING",
  CATEGORICAL: "CATEGORICAL",
} as const;
