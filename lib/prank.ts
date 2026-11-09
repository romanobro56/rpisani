import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { comments } from "@/db/schema";

// A one-off joke on the mystery commenter of Nov 9, 2026. Delete this file, the `prank` field in
// app/actions/comments.ts and components/flashbang.ts to remove it.

/** Names the mystery commenter posted under, lower-cased. */
const MYSTERY_NAMES = ["guess who", "real real roman", "realest roman", "roman 2.0 spencer combo"];

/** True when this comment uses one of those names, or comes from an IP that has posted under one. */
export async function isMysteryCommenter(db: Db, name: string, ipHash: string): Promise<boolean> {
  if (MYSTERY_NAMES.includes(name.trim().toLowerCase())) return true;
  const [hit] = await db
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.ipHash, ipHash), inArray(sql`lower(${comments.authorName})`, MYSTERY_NAMES)))
    .limit(1);
  return Boolean(hit);
}
