import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { blogPosts, feedPostMedia, feedPosts } from "@/db/schema";

export type MediaUse = { type: "feed" | "blog"; id: string; label: string };

// Blog posts embed media by URL, and every public media URL contains "/m/<mediaId>/".
const EMBED = /\/m\/([A-Za-z0-9]{12})\//g;

/** Which posts use each media item. Media missing from the map is unused. */
export async function getMediaUsage(db: Db): Promise<Map<string, MediaUse[]>> {
  const usage = new Map<string, MediaUse[]>();
  const add = (mediaId: string, use: MediaUse) => {
    const list = usage.get(mediaId) ?? [];
    if (!list.some((u) => u.type === use.type && u.id === use.id)) list.push(use);
    usage.set(mediaId, list);
  };

  const links = await db
    .select({ mediaId: feedPostMedia.mediaId, postId: feedPosts.id, title: feedPosts.title, body: feedPosts.body })
    .from(feedPostMedia)
    .innerJoin(feedPosts, eq(feedPostMedia.postId, feedPosts.id));
  for (const l of links) add(l.mediaId, { type: "feed", id: l.postId, label: l.title || l.body.slice(0, 60) || "Feed post" });

  const blogs = await db.select({ id: blogPosts.id, title: blogPosts.title, body: blogPosts.body }).from(blogPosts);
  for (const b of blogs) {
    for (const m of b.body.matchAll(EMBED)) add(m[1], { type: "blog", id: b.id, label: b.title });
  }
  return usage;
}
