/**
 * @deprecated Use @/db/drizzle instead
 * This file is kept for backward compatibility during migration.
 * All new code should use the Drizzle ORM client from @/db/drizzle.
 */

// Re-export Drizzle client as prisma for backward compatibility
export { db as prisma } from "@/db/drizzle";
