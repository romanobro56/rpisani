import { formatLongDate } from "@/lib/format";
import type { FeedPostView } from "@/lib/queries";
import { AudioPlayer } from "./AudioPlayer";
import { MediaCarousel } from "./MediaCarousel";
import { ShareButton } from "./ShareButton";

/** One post as a card: title, text, audio, photos/videos, then comment and share links with the date. */
export function FeedPost({ post, standalone = false }: { post: FeedPostView; standalone?: boolean }) {
  const href = `/feed/${post.id}/`;
  const audio = post.media.filter((m) => m.kind === "audio");
  const visual = post.media.filter((m) => m.kind !== "audio");
  const date = <time dateTime={post.publishedAt}>{formatLongDate(post.publishedAt)}</time>;
  return (
    <article className={`feed-post${standalone ? " feed-post--standalone" : ""}`}>
      {!standalone && post.pinned && (
        <div className="feed-post__pin">
          <i className="fas fa-thumbtack" aria-hidden="true"></i> Pinned
        </div>
      )}
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
      <div className="feed-post__footer">
        <div className="feed-post__actions">
          {!standalone && post.allowComments && (
            <a href={`${href}#comments`}>
              <i className="far fa-comment" aria-hidden="true"></i>{" "}
              {post.commentCount ? `${post.commentCount} ${post.commentCount === 1 ? "comment" : "comments"}` : "Comment"}
            </a>
          )}
          <ShareButton path={href} />
        </div>
        <div className="feed-post__date">{standalone ? date : <a href={href}>{date}</a>}</div>
      </div>
    </article>
  );
}
