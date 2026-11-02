"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { blogPosts, comments, feedPosts } from "@/db/schema";
import { clientIp, hashIp } from "@/lib/auth";
import { TAGS } from "@/lib/queries";

export type CommentFormState = { ok: boolean; error?: string; nonce?: number };

const schema = z.object({
  type: z.enum(["feed", "blog"]),
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Please add your name.").max(60, "Name is too long."),
  body: z.string().trim().min(1, "Comment can't be empty.").max(2000, "Comments are limited to 2,000 characters."),
  // Spam traps: a hidden field people never fill, and the time the form was shown.
  website: z.string().max(0).optional().or(z.literal("")),
  renderedAt: z.coerce.number(),
});

const MIN_FILL_MS = 3_000;
const LIMIT_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

export async function addComment(_prev: CommentFormState, form: FormData): Promise<CommentFormState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  const { type, id, name, body, website, renderedAt } = parsed.data;

  // Bots that fill everything in, or submit instantly, get a quiet success and nothing is saved.
  if (website || Date.now() - renderedAt < MIN_FILL_MS) return { ok: true, nonce: Date.now() };

  const db = await getDb();
  const table = type === "feed" ? feedPosts : blogPosts;
  const [target] = await db
    .select({ id: table.id, allowComments: table.allowComments })
    .from(table)
    .where(and(eq(table.id, id), eq(table.status, "published")));
  if (!target || !target.allowComments) return { ok: false, error: "Comments are closed on this post." };

  const ipHash = hashIp(await clientIp(), "comments");
  const [{ n }] = await db
    .select({ n: count() })
    .from(comments)
    .where(and(eq(comments.ipHash, ipHash), gt(comments.createdAt, new Date(Date.now() - WINDOW_MS))));
  if (n >= LIMIT_PER_WINDOW) return { ok: false, error: "You're commenting a lot. Try again in a few minutes." };

  await db.insert(comments).values({ targetType: type, targetId: id, authorName: name, body, ipHash });
  revalidateTag(TAGS.comments(type, id), { expire: 0 });
  if (type === "feed") revalidateTag(TAGS.feed, { expire: 0 }); // comment counts on feed cards
  return { ok: true, nonce: Date.now() };
}
