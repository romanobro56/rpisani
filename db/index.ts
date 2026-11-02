import path from "node:path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "db/migrations");

// One connection per server process, kept across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

/**
 * Production uses DATABASE_URL (Neon, Supabase, or any Postgres).
 * Without it, local development runs an embedded Postgres (PGlite) under .data/,
 * migrated and seeded on first use, so `npm run dev` needs no setup.
 */
export function getDb(): Promise<Db> {
  globalForDb.__db ??= connect().catch((err) => {
    globalForDb.__db = undefined;
    throw err;
  });
  return globalForDb.__db;
}

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const [{ drizzle }, { default: postgres }] = await Promise.all([
      import("drizzle-orm/postgres-js"),
      import("postgres"),
    ]);
    // prepare: false keeps it compatible with pooled (PgBouncer) connection strings.
    const client = postgres(url, { prepare: false, max: process.env.VERCEL ? 1 : 5 });
    return drizzle(client, { schema });
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Add a Postgres database (e.g. Neon) to the Vercel project.");
  }

  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  const dataDir = path.join(process.cwd(), ".data/pglite");
  await (await import("node:fs/promises")).mkdir(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  const { importLegacyPosts } = await import("@/lib/legacy-import");
  await importLegacyPosts(db as unknown as Db);
  return db as unknown as Db;
}
