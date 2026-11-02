import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comments } from "@/components/Comments";
import { DraftBanner } from "@/components/DraftBanner";
import { FeedPost } from "@/components/FeedPost";
import { SiteShell } from "@/components/SiteShell";
import { isAdmin } from "@/lib/auth";
import { formatLongDate, truncate } from "@/lib/format";
import { getFeedPostForPreview, getPublishedFeedPost } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  return (await getPublishedFeedPost(id)) ?? ((await isAdmin()) ? await getFeedPostForPreview(id) : null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load((await params).id);
  if (!post) return {};
  const summary =
    post.title || (post.body.trim() ? truncate(post.body, 70) : `Post from ${formatLongDate(post.publishedAt)}`);
  const image =
    post.media.find((m) => m.kind === "image")?.src ??
    post.media.find((m) => m.poster)?.poster ??
    (post.media.find((m) => m.kind === "audio" && m.thumb)?.thumb || undefined);
  return {
    title: `${summary} | ${site.title}`,
    description: truncate(post.body, 160) || summary,
    alternates: { canonical: `${site.url}/feed/${post.id}/` },
    openGraph: { type: "article", title: summary, images: image ? [image] : undefined },
  };
}

export default async function FeedPostPage({ params }: Props) {
  const { id } = await params;
  const post = await load(id);
  if (!post) notFound();
  const published = await getPublishedFeedPost(id);

  return (
    <SiteShell>
      {!published && <DraftBanner editHref={`/admin/posts/${post.id}/`} />}
      <p>
        <a href="/feed/">← Back to Feed</a>
      </p>
      <FeedPost post={post} standalone />
      {published && post.allowComments && <Comments type="feed" id={post.id} />}
    </SiteShell>
  );
}
