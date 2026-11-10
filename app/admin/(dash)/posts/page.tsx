import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { getDb } from "@/db";
import { comments, feedPostMedia, feedPosts, media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { toAdminMedia } from "@/lib/admin-media";
import { MediaThumb } from "@/components/admin/MediaThumb";
import { formatShortDate, truncate } from "@/lib/format";
import { getViewsByPath } from "@/lib/stats";

export const metadata = { title: "Posts" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function PostsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = status === "draft" || status === "published" ? status : undefined;
  const db = await getDb();
  const posts = await db
    .select()
    .from(feedPosts)
    .where(filter ? eq(feedPosts.status, filter) : undefined)
    .orderBy(desc(sql`coalesce(${feedPosts.publishedAt}, ${feedPosts.updatedAt})`));
  const ids = posts.map((p) => p.id);
  const [mediaRows, commentCounts, views] = await Promise.all([
    ids.length
      ? db
          .select({ postId: feedPostMedia.postId, m: media })
          .from(feedPostMedia)
          .innerJoin(media, eq(feedPostMedia.mediaId, media.id))
          .where(inArray(feedPostMedia.postId, ids))
          .orderBy(asc(feedPostMedia.position))
      : [],
    ids.length
      ? db
          .select({ id: comments.targetId, n: count() })
          .from(comments)
          .where(and(eq(comments.targetType, "feed"), inArray(comments.targetId, ids)))
          .groupBy(comments.targetId)
      : [],
    getViewsByPath(),
  ]);

  return (
    <>
      <div className="admin-head">
        <h1>Posts</h1>
        <div className="admin-actions">
          <a className="admin-btn admin-btn--primary" href="/admin/posts/new/">
            <i className="fas fa-plus" aria-hidden="true"></i> New post
          </a>
        </div>
      </div>
      <StatusTabs base="/admin/posts/" active={filter} />
      {posts.length ? (
        <table className="admin-table admin-table--posts">
          <thead>
            <tr>
              <th></th>
              <th>Post</th>
              <th>Status</th>
              <th>Date</th>
              <th className="num">Views (30d)</th>
              <th className="num">Comments</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => {
              const items = mediaRows.filter((r) => r.postId === p.id).map((r) => toAdminMedia(r.m));
              const first = items.find((m) => m.kind !== "audio") ?? items[0];
              const count = (kind: string) => items.filter((m) => m.kind === kind).length;
              const plural = (n: number, word: string) => n && `${n} ${word}${n > 1 ? "s" : ""}`;
              const summary = [
                plural(count("image"), "photo"),
                plural(count("video"), "video"),
                count("audio") && `${count("audio")} audio`,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <tr key={p.id}>
                  <td className="thumb-cell">
                    <a href={`/admin/posts/${p.id}/`}>
                      {first ? (
                        <MediaThumb m={first} className="admin-thumb" />
                      ) : (
                        <span className="admin-thumb admin-thumb--text">
                          <i className="fas fa-align-left" aria-hidden="true"></i>
                        </span>
                      )}
                    </a>
                  </td>
                  <td>
                    <a href={`/admin/posts/${p.id}/`} className="admin-row-title">
                      {p.pinned && <i className="fas fa-thumbtack admin-pin" title="Pinned" aria-label="Pinned"></i>}
                      {p.title || (p.body.trim() ? truncate(p.body, 90) : <em>Untitled media post</em>)}
                    </a>
                    <div className="admin-muted admin-small">{summary || "Text only"}</div>
                  </td>
                  <td>
                    <span className={`badge-status badge-status--${p.status}`}>{p.status === "draft" ? "Draft" : "Published"}</span>
                  </td>
                  <td className="admin-nowrap">{formatShortDate(p.publishedAt ?? p.updatedAt)}</td>
                  <td className="num">{p.status === "published" ? (views.get(`/feed/${p.id}/`) ?? 0) : "–"}</td>
                  <td className="num">{commentCounts.find((c) => c.id === p.id)?.n ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="admin-empty">
          No posts here yet. <a href="/admin/posts/new/">Write the first one.</a>
        </p>
      )}
    </>
  );
}
