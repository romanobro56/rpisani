import { formatLongDate } from "@/lib/format";
import { getComments } from "@/lib/queries";
import { CommentForm } from "./CommentForm";

export async function Comments({ type, id }: { type: "feed" | "blog"; id: string }) {
  const list = await getComments(type, id);
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
