// Applies db/migrations to DATABASE_URL, then imports the legacy markdown posts once.
// Runs before `next build` on Vercel (see vercel.json). Without DATABASE_URL it does nothing,
// because local development migrates its embedded database automatically.
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../db/schema";
import { importLegacyPosts } from "../lib/legacy-import";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set; skipping migrations (local dev uses the embedded database).");
    return;
  }
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "db/migrations") });
  const imported = await importLegacyPosts(db);
  console.log(`Migrations applied.${imported ? ` Imported ${imported} legacy blog posts.` : ""}`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
