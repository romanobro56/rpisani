import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const postStatus = pgEnum("post_status", ["draft", "published"]);
export const mediaKind = pgEnum("media_kind", ["image", "video", "audio"]);
export const mediaStatus = pgEnum("media_status", ["uploading", "ready"]);
export const commentTarget = pgEnum("comment_target", ["feed", "blog"]);
// "pending" comments wait for approval. Code that inserts a comment always sets the status itself;
// the column default stays "visible" because Postgres can't use a new enum value in the migration that adds it.
export const commentStatus = pgEnum("comment_status", ["visible", "hidden", "pending"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Long-form markdown posts, served at /posts/<slug>/. */
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  // Null means "estimate from the body".
  readTime: text("read_time"),
  status: postStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  allowComments: boolean("allow_comments").notNull().default(true),
  ...timestamps,
});

/** Short feed posts: an optional title, text, photos, videos, audio, or any mix. Served at /feed/<id>/. */
export const feedPosts = pgTable(
  "feed_posts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    /** Pinned posts sit above the rest of the feed, newest first. */
    pinned: boolean("pinned").notNull().default(false),
    status: postStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    allowComments: boolean("allow_comments").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("feed_posts_published_idx").on(t.status, t.publishedAt)],
);

export type MediaKeys = {
  /** Untouched upload, kept for safekeeping and never linked publicly. Images only. */
  original?: string;
  /** Web-sized image (long edge <= 2048px). */
  display?: string;
  /** Small image for grids (long edge <= 640px). For audio, the optional cover art. */
  thumb?: string;
  /** The playable video file. */
  video?: string;
  /** Video still frame. */
  poster?: string;
  /** The playable audio file. */
  audio?: string;
};

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  kind: mediaKind("kind").notNull(),
  status: mediaStatus("status").notNull().default("uploading"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  durationSec: real("duration_sec"),
  alt: text("alt").notNull().default(""),
  keys: jsonb("keys").$type<MediaKeys>().notNull(),
  totalBytes: bigint("total_bytes", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedPostMedia = pgTable(
  "feed_post_media",
  {
    postId: text("post_id")
      .notNull()
      .references(() => feedPosts.id, { onDelete: "cascade" }),
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.mediaId] }), index("feed_post_media_media_idx").on(t.mediaId)],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: commentTarget("target_type").notNull(),
    targetId: text("target_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    status: commentStatus("status").notNull().default("visible"),
    ipHash: text("ip_hash").notNull(),
    /** Random id from the commenter's cookie. Null on comments made before the cookie existed. */
    visitorId: text("visitor_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("comments_target_idx").on(t.targetType, t.targetId, t.createdAt),
    index("comments_visitor_idx").on(t.visitorId),
  ],
);

/**
 * Blocked commenters, matched by network (ipHash) or browser (visitorId). Their comments are saved
 * as hidden. When a blocked commenter turns up with a new network or browser, that is added as a
 * row pointing at the original block (originId), so unblocking removes them together.
 */
export const commentBlocks = pgTable(
  "comment_blocks",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash"),
    visitorId: text("visitor_id"),
    /** The name on the comment that was blocked, to recognise the entry later. */
    label: text("label").notNull().default(""),
    originId: integer("origin_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comment_blocks_ip_idx").on(t.ipHash), index("comment_blocks_visitor_idx").on(t.visitorId)],
);

/** One row per public page view. No cookies; visitors are a daily-rotating hash. */
export const pageViews = pgTable(
  "page_views",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    visitorHash: text("visitor_hash").notNull(),
    country: text("country"),
    device: text("device").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("page_views_created_idx").on(t.createdAt), index("page_views_path_idx").on(t.path)],
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_idx").on(t.ipHash, t.createdAt)],
);

/** Small key/value store for one-off flags such as "legacy posts imported". */
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
});
