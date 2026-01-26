/**
 * Palette database operations using Drizzle ORM
 */
import { eq } from "drizzle-orm";

import {
  convertDBTypeToPaletteType,
  convertPaletteTypeToDBType,
  CustomPaletteType,
} from "@/config-types";
import { db } from "@/db/drizzle";
import { palettes, PaletteType } from "@/db/schema";
import {
  CreateCustomColorPalette,
  UpdateCustomColorPalette,
} from "@/utils/chart-config/api";

export const createPaletteForUser = async (
  data: CreateCustomColorPalette & { user_id: number }
): Promise<CustomPaletteType> => {
  const [palette] = await db
    .insert(palettes)
    .values({
      name: data.name,
      type: convertPaletteTypeToDBType(data.type) as PaletteType,
      colors: data.colors,
      user_id: data.user_id,
      updated_at: new Date(),
    })
    .returning();

  return {
    ...palette,
    type: convertDBTypeToPaletteType(palette.type),
  };
};

export const getPalettesForUser = async ({
  user_id,
}: {
  user_id: number;
}): Promise<CustomPaletteType[]> => {
  const userPalettes = await db
    .select()
    .from(palettes)
    .where(eq(palettes.user_id, user_id));

  return userPalettes.map((palette) => {
    return {
      paletteId: palette.paletteId,
      name: palette.name,
      colors: palette.colors,
      type: convertDBTypeToPaletteType(palette.type),
    };
  });
};

export const deletePaletteForUser = async ({
  paletteId,
  user_id,
}: {
  paletteId: string;
  user_id: number;
}) => {
  const [palette] = await db
    .select()
    .from(palettes)
    .where(eq(palettes.paletteId, paletteId))
    .limit(1);

  if (!palette || palette.user_id !== user_id) {
    throw new Error("Palette not found");
  }

  await db.delete(palettes).where(eq(palettes.paletteId, paletteId));
};

export const updatePaletteForUser = async ({
  type,
  paletteId,
  name,
  colors,
  user_id,
}: UpdateCustomColorPalette & { user_id: number }) => {
  const [palette] = await db
    .select()
    .from(palettes)
    .where(eq(palettes.paletteId, paletteId))
    .limit(1);

  if (!palette || palette.user_id !== user_id) {
    throw new Error("Palette not found");
  }

  await db
    .update(palettes)
    .set({
      name,
      colors,
      type: type ? (convertPaletteTypeToDBType(type) as PaletteType) : undefined,
      updated_at: new Date(),
    })
    .where(eq(palettes.paletteId, paletteId));
};
