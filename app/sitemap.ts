import type { MetadataRoute } from "next";
import { getFeedPage, getPublishedBlogPosts } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, feed] = await Promise.all([getPublishedBlogPosts(), getFeedPage(1)]);
  return [
    { url: `${site.url}/` },
    { url: `${site.url}/blog/` },
    { url: `${site.url}/feed/` },
    { url: `${site.url}/gallery/` },
    { url: `${site.url}/usemindful/privacy/` },
    ...posts.map((p) => ({ url: `${site.url}/posts/${p.slug}/`, lastModified: p.publishedAt })),
    ...feed.posts.map((p) => ({ url: `${site.url}/feed/${p.id}/`, lastModified: p.publishedAt })),
  ];
}
