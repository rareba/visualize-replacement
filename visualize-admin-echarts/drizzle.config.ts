import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment from .env file
dotenv.config();

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./app/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
