import { desc, eq, inArray } from "drizzle-orm";
import { deleteComment, setCommentVisibility } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { getDb } from "@/db";
import { blogPosts, comments, feedPosts } from "@/db/schema";
import { formatShortDate, truncate } from "@/lib/format";

export const metadata = { title: "Comments" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function CommentsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const filter = status === "hidden" || status === "visible" ? status : undefined;
  const db = await getDb();
  const rows = await db
    .select()
    .from(comments)
    .where(filter ? eq(comments.status, filter) : undefined)
    .orderBy(desc(comments.createdAt))
    .limit(300);

  const feedIds = rows.filter((c) => c.targetType === "feed").map((c) => c.targetId);
  const blogIds = rows.filter((c) => c.targetType === "blog").map((c) => c.targetId);
  const [feed, blog] = await Promise.all([
    feedIds.length ? db.select({ id: feedPosts.id, title: feedPosts.title, body: feedPosts.body }).from(feedPosts).where(inArray(feedPosts.id, feedIds)) : [],
    blogIds.length
      ? db.select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug }).from(blogPosts).where(inArray(blogPosts.id, blogIds))
      : [],
  ]);
  const target = (c: (typeof rows)[number]) => {
    if (c.targetType === "feed") {
      const p = feed.find((f) => f.id === c.targetId);
      return { href: `/feed/${c.targetId}/#comment-${c.id}`, label: p?.title || (p?.body.trim() ? truncate(p.body, 50) : "Feed post") };
    }
    const p = blog.find((b) => b.id === c.targetId);
    return { href: p ? `/posts/${p.slug}/#comment-${c.id}` : "#", label: p?.title ?? "Deleted post" };
  };

  return (
    <>
      <div className="admin-head">
        <h1>Comments</h1>
      </div>
      <nav className="admin-tabs" aria-label="Filter comments">
        {(
          [
            [undefined, "All"],
            ["visible", "Visible"],
            ["hidden", "Hidden"],
          ] as const
        ).map(([value, label]) => (
          <a key={label} href={value ? `?status=${value}` : "/admin/comments/"} className={filter === value ? "is-active" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      {rows.length ? (
        <ul className="comment-admin">
          {rows.map((c) => {
            const t = target(c);
            return (
              <li key={c.id} className={c.status === "hidden" ? "is-hidden" : undefined}>
                <div className="comment-admin__meta">
                  <strong>{c.authorName}</strong> <span className="admin-muted">{formatShortDate(c.createdAt)}</span> on{" "}
                  <a href={t.href} target="_blank" rel="noopener">
                    {t.label}
                  </a>
                  {c.status === "hidden" && <span className="badge-status badge-status--draft">Hidden</span>}
                </div>
                <p className="comment-admin__body">{c.body}</p>
                <div className="comment-admin__actions">
                  <form action={setCommentVisibility.bind(null, c.id, c.status === "hidden")}>
                    <button type="submit" className="admin-link-button">
                      {c.status === "hidden" ? "Show" : "Hide"}
                    </button>
                  </form>
                  <form action={deleteComment.bind(null, c.id)}>
                    <ConfirmButton message={`Delete this comment from ${c.authorName}?`} className="admin-link-button admin-danger">
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="admin-empty">No comments yet.</p>
      )}
    </>
  );
}
