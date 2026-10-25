import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { normalizeDatabaseUrl } from "./src/lib/database-url";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: normalizeDatabaseUrl(url) },
  verbose: true,
});
