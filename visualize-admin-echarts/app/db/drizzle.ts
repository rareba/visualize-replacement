/**
 * Drizzle Database Client
 * Replaces Prisma client
 *
 * Only one instance is kept across hot reloads to prevent
 * "FATAL: sorry, too many clients already" error.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

const g = global as unknown as {
  pool: Pool | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool, { schema });
} else {
  if (!g.pool) {
    g.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  if (!g.db) {
    g.db = drizzle(g.pool, { schema });
  }

  pool = g.pool;
  db = g.db;
}

export { db, pool };
