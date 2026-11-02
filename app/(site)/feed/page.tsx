import type { Metadata } from "next";
import { FeedPost } from "@/components/FeedPost";
import { MediaTabs, Pager } from "@/components/MediaTabs";
import { SiteShell } from "@/components/SiteShell";
import { getFeedPage } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Feed | ${site.title}`,
  description: `Posts, photos, and videos from ${site.title}.`,
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function FeedPage({ searchParams }: Props) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const { posts, hasMore } = await getFeedPage(page);

  return (
    <SiteShell>
      <MediaTabs active="feed" />
      {posts.length ? (
        <div className="feed">
          {posts.map((p) => (
            <FeedPost key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="feed-empty">Nothing posted yet.</p>
      )}
      <Pager base="/feed/" page={page} hasMore={hasMore} />
    </SiteShell>
  );
}
