import { count, desc, eq, inArray } from "drizzle-orm";
import { blockCommenter, deleteComment, setCommentVisibility, unblockCommenter } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { getDb } from "@/db";
import { blogPosts, commentBlocks, comments, feedPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatShortDate, truncate } from "@/lib/format";

export const metadata = { title: "Comments" };

type Props = { searchParams: Promise<{ status?: string }> };

const STATUSES = ["pending", "visible", "hidden"] as const;

export default async function CommentsPage({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = STATUSES.find((s) => s === status);
  const db = await getDb();
  const [rows, blocks, [{ pending }]] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(filter ? eq(comments.status, filter) : undefined)
      .orderBy(desc(comments.createdAt))
      .limit(300),
    db.select().from(commentBlocks).orderBy(desc(commentBlocks.createdAt)),
    db.select({ pending: count() }).from(comments).where(eq(comments.status, "pending")),
  ]);

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

  const blockedIps = new Set(blocks.map((b) => b.ipHash).filter(Boolean));
  const blockedVisitors = new Set(blocks.map((b) => b.visitorId).filter(Boolean));
  const isBlocked = (c: (typeof rows)[number]) => blockedIps.has(c.ipHash) || (c.visitorId !== null && blockedVisitors.has(c.visitorId));
  // One entry per block; the networks and browsers it picked up later are counted, not listed.
  const blockList = blocks
    .filter((b) => b.originId === null)
    .map((b) => ({ ...b, extra: blocks.filter((x) => x.originId === b.id).length }));

  const tabs = [
    [undefined, "All"],
    ["pending", pending ? `To approve (${pending})` : "To approve"],
    ["visible", "Visible"],
    ["hidden", "Hidden"],
  ] as const;

  return (
    <>
      <div className="admin-head">
        <h1>Comments</h1>
      </div>
      <nav className="admin-tabs" aria-label="Filter comments">
        {tabs.map(([value, label]) => (
          <a key={value ?? "all"} href={value ? `?status=${value}` : "/admin/comments/"} className={filter === value ? "is-active" : undefined}>
            {label}
          </a>
        ))}
      </nav>
      {rows.length ? (
        <ul className="comment-admin">
          {rows.map((c) => {
            const t = target(c);
            const blocked = isBlocked(c);
            return (
              <li key={c.id} className={c.status === "hidden" ? "is-hidden" : undefined}>
                <div className="comment-admin__meta">
                  <strong>{c.authorName}</strong> <span className="admin-muted">{formatShortDate(c.createdAt)}</span> on{" "}
                  <a href={t.href} target="_blank" rel="noopener">
                    {t.label}
                  </a>
                  {c.status === "pending" && <span className="badge-status badge-status--draft">Awaiting approval</span>}
                  {c.status === "hidden" && <span className="badge-status badge-status--draft">Hidden</span>}
                  {blocked && <span className="badge-status badge-status--blocked">Blocked commenter</span>}
                </div>
                <p className="comment-admin__body">{c.body}</p>
                <div className="comment-admin__actions">
                  {c.status !== "visible" && (
                    <form action={setCommentVisibility.bind(null, c.id, true)}>
                      <button type="submit" className="admin-link-button">
                        {c.status === "pending" ? "Approve" : "Show"}
                      </button>
                    </form>
                  )}
                  {c.status !== "hidden" && (
                    <form action={setCommentVisibility.bind(null, c.id, false)}>
                      <button type="submit" className="admin-link-button">
                        Hide
                      </button>
                    </form>
                  )}
                  {!blocked && (
                    <form action={blockCommenter.bind(null, c.id)}>
                      <ConfirmButton
                        message={`Block ${c.authorName}? Their comments are hidden from everyone else from now on, and they aren't told.`}
                        className="admin-link-button admin-danger"
                      >
                        Block commenter
                      </ConfirmButton>
                    </form>
                  )}
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
        <p className="admin-empty">{filter === "pending" ? "Nothing waiting for approval." : "No comments yet."}</p>
      )}

      {blockList.length > 0 && (
        <div className="admin-card comment-blocks">
          <h3>Blocked commenters</h3>
          <p className="admin-muted admin-small">
            Matched by network and by browser. Their new comments are saved as hidden, shown only to them, and don’t
            send you an email.
          </p>
          <ul className="admin-list">
            {blockList.map((b) => (
              <li key={b.id}>
                <strong>{b.label || "Unnamed"}</strong> <span className="admin-muted">blocked {formatShortDate(b.createdAt)}</span>
                {b.extra > 0 && <span className="admin-muted"> · also seen on {b.extra} other {b.extra === 1 ? "network or browser" : "networks or browsers"}</span>}
                <form action={unblockCommenter.bind(null, b.id)}>
                  <button type="submit" className="admin-link-button">
                    Unblock
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
