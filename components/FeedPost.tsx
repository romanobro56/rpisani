import { formatLongDate } from "@/lib/format";
import type { FeedPostView } from "@/lib/queries";
import { AudioPlayer } from "./AudioPlayer";
import { MediaCarousel } from "./MediaCarousel";

/** One post as a card: date, title, text, audio, then photos/videos (Twitter-style reading order). */
export function FeedPost({ post, standalone = false }: { post: FeedPostView; standalone?: boolean }) {
  const href = `/feed/${post.id}/`;
  const audio = post.media.filter((m) => m.kind === "audio");
  const visual = post.media.filter((m) => m.kind !== "audio");
  return (
    <article className={`feed-post${standalone ? " feed-post--standalone" : ""}`}>
      <div className="feed-post__meta">
        {!standalone && post.pinned && (
          <span className="feed-post__pin">
            <i className="fas fa-thumbtack" aria-hidden="true"></i> Pinned ·{" "}
          </span>
        )}
        {standalone ? (
          <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
        ) : (
          <a href={href}>
            <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>
          </a>
        )}
      </div>
      {post.title && <h2 className="feed-post__title">{standalone ? post.title : <a href={href}>{post.title}</a>}</h2>}
      {post.bodyHtml && <div className="feed-post__body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />}
      {audio.length > 0 && (
        <div className="feed-post__audio">
          {audio.map((m) => (
            <AudioPlayer key={m.id} m={m} />
          ))}
        </div>
      )}
      <MediaCarousel media={visual} eager={standalone} />
      {!standalone && post.allowComments && (
        <div className="feed-post__footer">
          <a href={`${href}#comments`}>
            <i className="far fa-comment" aria-hidden="true"></i>{" "}
            {post.commentCount ? `${post.commentCount} ${post.commentCount === 1 ? "comment" : "comments"}` : "Comment"}
          </a>
        </div>
      )}
    </article>
  );
}
