"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { blogPosts, comments, feedPostMedia, feedPosts, media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { fromDateInput, slugify, toDateInput } from "@/lib/format";
import { getMediaUsage } from "@/lib/media-usage";
import { newId } from "@/lib/ids";
import { TAGS } from "@/lib/queries";
import { getStorage } from "@/lib/storage";

// Admin saves should show up on the next page load, not after a stale render.
const NOW = { expire: 0 };

type Intent = "draft" | "publish" | "unpublish";
export type SaveResult = { ok: true; id: string; status: "draft" | "published"; slug?: string } | { ok: false; error: string };

function nextStatus(intent: Intent, current: "draft" | "published" | undefined): "draft" | "published" {
  if (intent === "publish") return "published";
  if (intent === "unpublish") return "draft";
  return current ?? "draft";
}

// ---- Feed posts ---------------------------------------------------------------------------

const feedSchema = z.object({
  id: z.string().max(64).optional(),
  title: z.string().max(200, "Titles are limited to 200 characters."),
  body: z.string().max(5000, "Posts are limited to 5,000 characters."),
  pinned: z.boolean(),
  mediaIds: z.array(z.string().max(64)).max(20, "A post can hold up to 20 photos, videos, and audio files."),
  alts: z.record(z.string(), z.string().max(500)),
  allowComments: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  intent: z.enum(["draft", "publish", "unpublish"]),
});

export async function saveFeedPost(input: z.infer<typeof feedSchema>): Promise<SaveResult> {
  await requireAdmin();
  const parsed = feedSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." };
  const { id, title, body, pinned, mediaIds, alts, allowComments, date, intent } = parsed.data;
  const ids = [...new Set(mediaIds)];
  if (!title.trim() && !body.trim() && !ids.length) return { ok: false, error: "Add a title, some text, or some media." };

  const db = await getDb();
  if (ids.length) {
    const found = await db
      .select({ id: media.id })
      .from(media)
      .where(and(inArray(media.id, ids), eq(media.status, "ready")));
    if (found.length !== ids.length) return { ok: false, error: "Some media is still uploading or was deleted." };
  }

  const existing = id ? (await db.select().from(feedPosts).where(eq(feedPosts.id, id)))[0] : undefined;
  if (id && !existing) return { ok: false, error: "Post not found." };
  const status = nextStatus(intent, existing?.status);
  const publishedAt = resolvePublishedAt(date, existing?.publishedAt ?? null, status);

  const postId = existing?.id ?? newId(10);
  await db.transaction(async (tx) => {
    const values = {
      title: title.trim(),
      body: body.trim(),
      pinned,
      status,
      allowComments,
      publishedAt,
      updatedAt: new Date(),
    };
    if (existing) await tx.update(feedPosts).set(values).where(eq(feedPosts.id, postId));
    else await tx.insert(feedPosts).values({ id: postId, ...values });

    await tx.delete(feedPostMedia).where(eq(feedPostMedia.postId, postId));
    if (ids.length) {
      await tx.insert(feedPostMedia).values(ids.map((mediaId, position) => ({ postId, mediaId, position })));
    }
    for (const mediaId of ids) {
      if (alts[mediaId] !== undefined) await tx.update(media).set({ alt: alts[mediaId].trim() }).where(eq(media.id, mediaId));
    }
  });

  revalidateTag(TAGS.feed, NOW);
  return { ok: true, id: postId, status };
}

/**
 * The editor picks a calendar day. Keep the exact timestamp when that day is unchanged (or is today),
 * so posts made on the same day keep their order; otherwise use noon on the chosen day.
 */
function resolvePublishedAt(date: string | null, existing: Date | null, status: "draft" | "published"): Date | null {
  if (!date) return existing ?? (status === "published" ? new Date() : null);
  if (existing && toDateInput(existing) === date) return existing;
  if (toDateInput(new Date()) === date) return new Date();
  return fromDateInput(date);
}

/** Deletes a post. Its photos and videos are deleted too unless another post uses them. */
export async function deleteFeedPost(id: string): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const attached = await db.select({ id: feedPostMedia.mediaId }).from(feedPostMedia).where(eq(feedPostMedia.postId, id));
  const mediaIds = attached.map((a) => a.id);
  await db.delete(feedPosts).where(eq(feedPosts.id, id));
  const usage = await getMediaUsage(db);
  const orphaned = mediaIds.filter((m) => !usage.get(m));
  await db.delete(comments).where(and(eq(comments.targetType, "feed"), eq(comments.targetId, id)));
  await removeMedia(orphaned);
  revalidateTag(TAGS.feed, NOW);
  revalidateTag(TAGS.comments("feed", id), NOW);
}

// ---- Blog posts ---------------------------------------------------------------------------

const blogSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Add a title.").max(200),
  slug: z.string().trim().max(80),
  excerpt: z.string().trim().max(500),
  body: z.string().max(500_000),
  readTime: z.string().trim().max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  allowComments: z.boolean(),
  intent: z.enum(["draft", "publish", "unpublish"]),
});

export async function saveBlogPost(input: z.infer<typeof blogSchema>): Promise<SaveResult> {
  await requireAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." };
  const { id, title, excerpt, body, readTime, date, allowComments, intent } = parsed.data;
  const slug = slugify(parsed.data.slug || title);
  if (!slug) return { ok: false, error: "Add a URL slug." };

  const db = await getDb();
  const [clash] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(id ? and(eq(blogPosts.slug, slug), ne(blogPosts.id, id)) : eq(blogPosts.slug, slug));
  if (clash) return { ok: false, error: `Another post already uses /posts/${slug}/.` };

  const existing = id ? (await db.select().from(blogPosts).where(eq(blogPosts.id, id)))[0] : undefined;
  if (id && !existing) return { ok: false, error: "Post not found." };
  const status = nextStatus(intent, existing?.status);
  const publishedAt = resolvePublishedAt(date, existing?.publishedAt ?? null, status);

  const values = {
    title,
    slug,
    excerpt,
    body,
    readTime: readTime || null,
    allowComments,
    status,
    publishedAt,
    updatedAt: new Date(),
  };
  let postId = existing?.id;
  if (existing) {
    await db.update(blogPosts).set(values).where(eq(blogPosts.id, existing.id));
  } else {
    const [row] = await db.insert(blogPosts).values(values).returning({ id: blogPosts.id });
    postId = row.id;
  }
  revalidateTag(TAGS.blog, NOW);
  return { ok: true, id: postId!, status, slug };
}

export async function deleteBlogPost(id: string): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  await db.delete(comments).where(and(eq(comments.targetType, "blog"), eq(comments.targetId, id)));
  revalidateTag(TAGS.blog, NOW);
  revalidateTag(TAGS.comments("blog", id), NOW);
}

// ---- Comments -----------------------------------------------------------------------------

async function revalidateComment(id: string) {
  const db = await getDb();
  const [c] = await db.select().from(comments).where(eq(comments.id, id));
  if (!c) return null;
  return () => {
    revalidateTag(TAGS.comments(c.targetType, c.targetId), NOW);
    if (c.targetType === "feed") revalidateTag(TAGS.feed, NOW);
  };
}

export async function setCommentVisibility(id: string, visible: boolean): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.update(comments).set({ status: visible ? "visible" : "hidden" }).where(eq(comments.id, id));
  (await revalidateComment(id))?.();
}

export async function deleteComment(id: string): Promise<void> {
  await requireAdmin();
  const done = await revalidateComment(id);
  const db = await getDb();
  await db.delete(comments).where(eq(comments.id, id));
  done?.();
}

// ---- Media --------------------------------------------------------------------------------

async function removeMedia(ids: string[]) {
  if (!ids.length) return;
  const db = await getDb();
  const rows = await db.select().from(media).where(inArray(media.id, ids));
  const keys = rows.flatMap((r) => Object.values(r.keys).filter(Boolean) as string[]);
  await getStorage().remove(keys);
  await db.delete(media).where(inArray(media.id, ids));
}

export async function updateMediaAlt(id: string, alt: string): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db.update(media).set({ alt: alt.trim().slice(0, 500) }).where(eq(media.id, id));
  revalidateTag(TAGS.feed, NOW);
}

/** Permanently deletes media from storage and removes it from any post. */
export async function deleteMedia(id: string): Promise<void> {
  await requireAdmin();
  await removeMedia([id]);
  revalidateTag(TAGS.feed, NOW);
}

/** Deletes every finished upload that no feed post or blog post uses. */
export async function deleteUnusedMedia(): Promise<number> {
  await requireAdmin();
  const db = await getDb();
  const usage = await getMediaUsage(db);
  const rows = await db.select({ id: media.id }).from(media).where(eq(media.status, "ready"));
  const unused = rows.map((r) => r.id).filter((id) => !usage.get(id));
  await removeMedia(unused);
  return unused.length;
}
