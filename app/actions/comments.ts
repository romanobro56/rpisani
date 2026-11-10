"use server";

import { and, count, eq, gt, sql } from "drizzle-orm";
import { refresh, revalidateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { blogPosts, comments, feedPosts } from "@/db/schema";
import { clientIp, hashIp } from "@/lib/auth";
import { queueCommentEmail } from "@/lib/comment-digest";
import { ensureCommenterId, statusForNewComment } from "@/lib/comment-moderation";
import { TAGS } from "@/lib/queries";
import { site } from "@/lib/site";

export type CommentFormState = { ok: boolean; error?: string; nonce?: number };

const schema = z.object({
  type: z.enum(["feed", "blog"]),
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Please add your name.").max(60, "Name is too long."),
  body: z.string().trim().min(1, "Comment can't be empty.").max(2000, "Comments are limited to 2,000 characters."),
  // Spam traps: a hidden field people never fill, and the time the form was shown.
  website: z.string().optional(),
  renderedAt: z.coerce.number(),
});

const PAUSED_MESSAGE = "Comments are paused for now.";
const CLOSED_MESSAGE = "Comments are closed on this post.";
const MIN_FILL_MS = 3_000;
const LIMIT_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function addComment(_prev: CommentFormState, form: FormData): Promise<CommentFormState> {
  if (site.commentsPaused) return { ok: false, error: PAUSED_MESSAGE };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  const { type, id, name, body, website, renderedAt } = parsed.data;

  // Bots that fill everything in, or submit instantly, get a quiet success and nothing is saved.
  if (website || Date.now() - renderedAt < MIN_FILL_MS) return { ok: true, nonce: Date.now() };

  // Blog ids are UUIDs; anything else would make the database reject the query with an error.
  if (type === "blog" && !z.uuid().safeParse(id).success) return { ok: false, error: CLOSED_MESSAGE };

  const db = await getDb();
  const table = type === "feed" ? feedPosts : blogPosts;
  const [target] = await db
    .select({ id: table.id, allowComments: table.allowComments })
    .from(table)
    .where(and(eq(table.id, id), eq(table.status, "published")));
  if (!target || !target.allowComments) return { ok: false, error: CLOSED_MESSAGE };

  const ipHash = hashIp(await clientIp(), "comments");
  const visitorId = await ensureCommenterId();
  const saved = await db.transaction(async (tx) => {
    // One comment at a time per visitor, so parallel posts can't all read the same count and slip past the limit.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${ipHash}))`);
    const [{ n }] = await tx
      .select({ n: count() })
      .from(comments)
      .where(and(eq(comments.ipHash, ipHash), gt(comments.createdAt, new Date(Date.now() - WINDOW_MS))));
    if (n >= LIMIT_PER_WINDOW) return null;
    const status = await statusForNewComment(tx, ipHash, visitorId);
    const [row] = await tx
      .insert(comments)
      .values({ targetType: type, targetId: id, authorName: name, body, ipHash, visitorId, status })
      .returning({ id: comments.id });
    return { id: row.id, status };
  });
  if (!saved) return { ok: false, error: "You're commenting a lot. Try again in a few minutes." };

  if (saved.status === "visible") {
    revalidateTag(TAGS.comments(type, id), { expire: 0 });
    if (type === "feed") revalidateTag(TAGS.feed, { expire: 0 }); // comment counts on feed cards
  }
  // Held and hidden comments still show to their author, so the page re-renders either way.
  refresh();
  // Blocked commenters don't get to ping the inbox.
  if (saved.status !== "hidden") {
    after(() => queueCommentEmail(saved.id).catch((err) => console.error("Comment email failed:", err)));
  }
  return { ok: true, nonce: Date.now() };
}
