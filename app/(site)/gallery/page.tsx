import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { MediaTabs, Pager } from "@/components/MediaTabs";
import { SiteShell } from "@/components/SiteShell";
import { formatLongDate, truncate } from "@/lib/format";
import { getGalleryPage } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Gallery | ${site.title}`,
  description: `Photos and videos from ${site.title}.`,
};

type Props = { searchParams: Promise<{ page?: string }> };

export default async function GalleryPage({ searchParams }: Props) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const { items, hasMore } = await getGalleryPage(page);

  return (
    <SiteShell>
      <MediaTabs active="gallery" />
      {items.length ? (
        <GalleryGrid
          items={items.map((m) => ({
            ...m,
            caption: truncate(m.postText, 220),
            date: formatLongDate(m.publishedAt),
          }))}
        />
      ) : (
        <p className="feed-empty">No photos or videos yet.</p>
      )}
      <Pager base="/gallery/" page={page} hasMore={hasMore} />
    </SiteShell>
  );
}
