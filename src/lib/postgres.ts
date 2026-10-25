import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { normalizeDatabaseUrl } from "./database-url";

type Db = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
  __reelprintPool?: Pool;
  __reelprintDb?: Db;
};

export function getDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add the Neon connection string to .env.local.");
  }

  if (!globalForDb.__reelprintPool) {
    globalForDb.__reelprintPool = new Pool({
      connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  if (!globalForDb.__reelprintDb) {
    globalForDb.__reelprintDb = drizzle({ client: globalForDb.__reelprintPool });
  }

  return globalForDb.__reelprintDb;
}
