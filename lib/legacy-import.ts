import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import matter from "gray-matter";
import type { Db } from "@/db";
import { blogPosts, kv } from "@/db/schema";
import { fromDateInput } from "./format";

const FLAG = "legacy_blog_imported";

/**
 * Copies the markdown posts from the old Jekyll site (content/blog/*.md) into the database once.
 * A flag records the import, so deleting a post in the admin does not bring it back on the next deploy.
 */
export async function importLegacyPosts(db: Db): Promise<number> {
  const done = await db.select().from(kv).where(eq(kv.key, FLAG));
  if (done.length) return 0;

  const dir = path.join(process.cwd(), "content/blog");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  let imported = 0;
  for (const file of files) {
    const { data, content } = matter(await readFile(path.join(dir, file), "utf8"));
    const date = String(data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date);
    // Drafts get no date, so publishing from the admin dates them on the day they go live.
    const draft = data.status === "draft";
    const rows = await db
      .insert(blogPosts)
      .values({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? "",
        body: content.trimStart(),
        readTime: data.read_time || null,
        status: draft ? "draft" : "published",
        publishedAt: draft ? null : fromDateInput(date),
      })
      .onConflictDoNothing({ target: blogPosts.slug })
      .returning({ id: blogPosts.id });
    imported += rows.length;
  }
  await db.insert(kv).values({ key: FLAG, value: { at: new Date().toISOString(), imported } }).onConflictDoNothing();
  return imported;
}
