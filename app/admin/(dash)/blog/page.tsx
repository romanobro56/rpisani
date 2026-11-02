import { and, count, desc, eq, sql } from "drizzle-orm";
import { StatusTabs } from "@/components/admin/StatusTabs";
import { getDb } from "@/db";
import { blogPosts, comments } from "@/db/schema";
import { estimateReadTime, formatShortDate } from "@/lib/format";
import { getViewsByPath } from "@/lib/stats";

export const metadata = { title: "Blog" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function BlogAdminPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const filter = status === "draft" || status === "published" ? status : undefined;
  const db = await getDb();
  const [posts, commentCounts, views] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .where(filter ? eq(blogPosts.status, filter) : undefined)
      .orderBy(desc(sql`coalesce(${blogPosts.publishedAt}, ${blogPosts.updatedAt})`)),
    db
      .select({ id: comments.targetId, n: count() })
      .from(comments)
      .where(and(eq(comments.targetType, "blog")))
      .groupBy(comments.targetId),
    getViewsByPath(),
  ]);

  return (
    <>
      <div className="admin-head">
        <h1>Blog</h1>
        <div className="admin-actions">
          <a className="admin-btn admin-btn--primary" href="/admin/blog/new/">
            <i className="fas fa-plus" aria-hidden="true"></i> New blog post
          </a>
        </div>
      </div>
      <StatusTabs base="/admin/blog/" active={filter} />
      {posts.length ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
              <th className="num">Views (30d)</th>
              <th className="num">Comments</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>
                  <a href={`/admin/blog/${p.id}/`} className="admin-row-title">
                    {p.title}
                  </a>
                  <div className="admin-muted admin-small">
                    /posts/{p.slug}/ · {p.readTime || estimateReadTime(p.body)}
                  </div>
                </td>
                <td>
                  <span className={`badge-status badge-status--${p.status}`}>{p.status === "draft" ? "Draft" : "Published"}</span>
                </td>
                <td className="admin-nowrap">{formatShortDate(p.publishedAt ?? p.updatedAt)}</td>
                <td className="num">{p.status === "published" ? (views.get(`/posts/${p.slug}/`) ?? 0) : "–"}</td>
                <td className="num">{commentCounts.find((c) => c.id === p.id)?.n ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="admin-empty">
          Nothing here yet. <a href="/admin/blog/new/">Start a blog post.</a>
        </p>
      )}
    </>
  );
}
