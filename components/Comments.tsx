import { formatLongDate } from "@/lib/format";
import { readCommenterId } from "@/lib/comment-moderation";
import { getComments, getOwnUnlistedComments } from "@/lib/queries";
import { CommentForm } from "./CommentForm";

export async function Comments({ type, id }: { type: "feed" | "blog"; id: string }) {
  const visitorId = await readCommenterId();
  const [listed, own] = await Promise.all([getComments(type, id), visitorId ? getOwnUnlistedComments(type, id, visitorId) : []]);
  const list = own.length ? [...listed, ...own].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : listed;
  return (
    <div className="comments" id="comments">
      <h3>
        {list.length ? `${list.length} ${list.length === 1 ? "Comment" : "Comments"}` : "Comments"}
      </h3>
      {list.length > 0 && (
        <ol className="comment-list">
          {list.map((c) => (
            <li className="comment" key={c.id} id={`comment-${c.id}`}>
              <div className="comment__meta">
                <strong>{c.authorName}</strong> &middot;{" "}
                <time dateTime={c.createdAt}>{formatLongDate(c.createdAt)}</time>
              </div>
              <div className="comment__body" dangerouslySetInnerHTML={{ __html: c.bodyHtml }} />
            </li>
          ))}
        </ol>
      )}
      <CommentForm type={type} id={id} />
    </div>
  );
}
