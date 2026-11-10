import "server-only";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/db";
import { blogPosts, comments, feedPostMedia, feedPosts, media } from "@/db/schema";
import { estimateReadTime } from "./format";
import { renderMarkdown, renderPlainText } from "./markdown";
import { mediaUrl } from "./storage";

// Public reads are cached and tagged; admin saves and new comments invalidate the tags.
// unstable_cache stores JSON, so every date crosses this boundary as an ISO string.
export const TAGS = {
  blog: "blog",
  feed: "feed",
  comments: (type: "feed" | "blog", id: string) => `comments:${type}:${id}`,
};

// Cached data outlives deploys on Vercel, but migrations and imports change rows without going
// through an admin action, so every deployment starts with its own cache. Entries also expire hourly.
const V = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
const HOUR = 3600;

export const FEED_PAGE_SIZE = 10;
export const GALLERY_PAGE_SIZE = 60;

export type MediaView = {
  id: string;
  kind: "image" | "video" | "audio";
  width: number | null;
  height: number | null;
  durationSec: number | null;
  alt: string;
  /** Display image, or the video or audio file. */
  src: string;
  /** Empty for audio without cover art. */
  thumb: string;
  poster: string | null;
};

export type FeedPostView = {
  id: string;
  title: string;
  pinned: boolean;
  body: string;
  bodyHtml: string;
  publishedAt: string;
  allowComments: boolean;
  media: MediaView[];
  commentCount: number;
};

export type BlogListItem = {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  publishedAt: string;
};

export type BlogPostView = BlogListItem & {
  id: string;
  bodyHtml: string;
  allowComments: boolean;
  status: "draft" | "published";
};

export type CommentView = { id: string; authorName: string; bodyHtml: string; createdAt: string };

export type GalleryItem = MediaView & { postId: string; postText: string; publishedAt: string };

type MediaRow = typeof media.$inferSelect;

export function toMediaView(m: MediaRow): MediaView {
  const k = m.keys;
  const main = m.kind === "video" ? k.video : m.kind === "audio" ? k.audio : k.display;
  const thumb = k.thumb ?? k.poster ?? k.display;
  return {
    id: m.id,
    kind: m.kind,
    width: m.width,
    height: m.height,
    durationSec: m.durationSec,
    alt: m.alt,
    src: main ? mediaUrl(main) : "",
    thumb: thumb ? mediaUrl(thumb) : "",
    poster: k.poster ? mediaUrl(k.poster) : null,
  };
}

// ---- Blog ---------------------------------------------------------------------------------

function toBlogListItem(p: typeof blogPosts.$inferSelect): BlogListItem {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    readTime: p.readTime || estimateReadTime(p.body),
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
  };
}

export const getPublishedBlogPosts = unstable_cache(
  async (): Promise<BlogListItem[]> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map(toBlogListItem);
  },
  ["published-blog-posts", V],
  { tags: [TAGS.blog], revalidate: HOUR },
);

function toBlogPostView(p: typeof blogPosts.$inferSelect): BlogPostView {
  return {
    ...toBlogListItem(p),
    id: p.id,
    bodyHtml: renderMarkdown(p.body),
    allowComments: p.allowComments,
    status: p.status,
  };
}

export const getPublishedBlogPost = unstable_cache(
  async (slug: string): Promise<BlogPostView | null> => {
    const db = await getDb();
    const [p] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
    return p ? toBlogPostView(p) : null;
  },
  ["published-blog-post", V],
  { tags: [TAGS.blog], revalidate: HOUR },
);

/** Uncached, any status. Only for an admin previewing a draft. */
export async function getBlogPostForPreview(slug: string): Promise<BlogPostView | null> {
  const db = await getDb();
  const [p] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
  return p ? toBlogPostView(p) : null;
}

// ---- Feed ---------------------------------------------------------------------------------

async function hydrateFeedPosts(rows: (typeof feedPosts.$inferSelect)[]): Promise<FeedPostView[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const [mediaRows, counts] = await Promise.all([
    db
      .select({ postId: feedPostMedia.postId, m: media })
      .from(feedPostMedia)
      .innerJoin(media, eq(feedPostMedia.mediaId, media.id))
      .where(and(inArray(feedPostMedia.postId, ids), eq(media.status, "ready")))
      .orderBy(asc(feedPostMedia.position)),
    db
      .select({ id: comments.targetId, n: count() })
      .from(comments)
      .where(and(eq(comments.targetType, "feed"), inArray(comments.targetId, ids), eq(comments.status, "visible")))
      .groupBy(comments.targetId),
  ]);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    pinned: r.pinned,
    body: r.body,
    bodyHtml: r.body.trim() ? renderPlainText(r.body) : "",
    publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
    allowComments: r.allowComments,
    media: mediaRows.filter((x) => x.postId === r.id).map((x) => toMediaView(x.m)),
    commentCount: counts.find((c) => c.id === r.id)?.n ?? 0,
  }));
}

export const getFeedPage = unstable_cache(
  async (page: number): Promise<{ posts: FeedPostView[]; hasMore: boolean }> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.status, "published"))
      .orderBy(desc(feedPosts.pinned), desc(feedPosts.publishedAt), desc(feedPosts.id))
      .limit(FEED_PAGE_SIZE + 1)
      .offset((page - 1) * FEED_PAGE_SIZE);
    return { posts: await hydrateFeedPosts(rows.slice(0, FEED_PAGE_SIZE)), hasMore: rows.length > FEED_PAGE_SIZE };
  },
  ["feed-page", V],
  { tags: [TAGS.feed], revalidate: HOUR },
);

export const getPublishedFeedPost = unstable_cache(
  async (id: string): Promise<FeedPostView | null> => {
    const db = await getDb();
    const rows = await db
      .select()
      .from(feedPosts)
      .where(and(eq(feedPosts.id, id), eq(feedPosts.status, "published")));
    return (await hydrateFeedPosts(rows))[0] ?? null;
  },
  ["feed-post", V],
  { tags: [TAGS.feed], revalidate: HOUR },
);

export async function getFeedPostForPreview(id: string): Promise<FeedPostView | null> {
  const db = await getDb();
  const rows = await db.select().from(feedPosts).where(eq(feedPosts.id, id));
  return (await hydrateFeedPosts(rows))[0] ?? null;
}

export const getGalleryPage = unstable_cache(
  async (page: number): Promise<{ items: GalleryItem[]; hasMore: boolean }> => {
    const db = await getDb();
    const rows = await db
      .select({ m: media, post: feedPosts })
      .from(feedPostMedia)
      .innerJoin(media, eq(feedPostMedia.mediaId, media.id))
      .innerJoin(feedPosts, eq(feedPostMedia.postId, feedPosts.id))
      // Photos and videos only; audio lives in the feed.
      .where(and(eq(feedPosts.status, "published"), eq(media.status, "ready"), ne(media.kind, "audio")))
      .orderBy(desc(feedPosts.publishedAt), desc(feedPosts.id), asc(feedPostMedia.position))
      .limit(GALLERY_PAGE_SIZE + 1)
      .offset((page - 1) * GALLERY_PAGE_SIZE);
    const items = rows.slice(0, GALLERY_PAGE_SIZE).map(({ m, post }) => ({
      ...toMediaView(m),
      postId: post.id,
      postText: post.body,
      publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    }));
    return { items, hasMore: rows.length > GALLERY_PAGE_SIZE };
  },
  ["gallery-page", V],
  { tags: [TAGS.feed], revalidate: HOUR },
);

// ---- Comments -----------------------------------------------------------------------------

type CommentRow = typeof comments.$inferSelect;

function toCommentView(c: CommentRow): CommentView {
  return { id: c.id, authorName: c.authorName, bodyHtml: renderPlainText(c.body), createdAt: c.createdAt.toISOString() };
}

/**
 * A commenter's own comments on a post that nobody else can see: held for approval, or hidden.
 * Shown back to them alongside the public ones, so a held or blocked comment looks posted. Uncached.
 */
export async function getOwnUnlistedComments(type: "feed" | "blog", id: string, visitorId: string): Promise<CommentView[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(
      and(eq(comments.targetType, type), eq(comments.targetId, id), eq(comments.visitorId, visitorId), ne(comments.status, "visible")),
    );
  return rows.map(toCommentView);
}

export function getComments(type: "feed" | "blog", id: string): Promise<CommentView[]> {
  return unstable_cache(
    async () => {
      const db = await getDb();
      const rows = await db
        .select()
        .from(comments)
        .where(and(eq(comments.targetType, type), eq(comments.targetId, id), eq(comments.status, "visible")))
        .orderBy(asc(comments.createdAt));
      return rows.map(toCommentView);
    },
    ["comments", V, type, id],
    { tags: [TAGS.comments(type, id)], revalidate: HOUR },
  )();
}
