import { getPublishedBlogPosts, getPublishedBlogPost } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** RSS-style Atom feed of blog posts, replacing jekyll-feed at the same URL. */
export async function GET() {
  const posts = (await getPublishedBlogPosts()).slice(0, 20);
  const full = await Promise.all(posts.map((p) => getPublishedBlogPost(p.slug)));
  const updated = posts[0]?.publishedAt ?? new Date().toISOString();
  const entries = full
    .filter((p) => p !== null)
    .map(
      (p) => `  <entry>
    <title>${esc(p.title)}</title>
    <link href="${site.url}/posts/${p.slug}/" rel="alternate" type="text/html" />
    <id>${site.url}/posts/${p.slug}/</id>
    <published>${p.publishedAt}</published>
    <updated>${p.publishedAt}</updated>
    <summary>${esc(p.excerpt)}</summary>
    <content type="html">${esc(p.bodyHtml)}</content>
  </entry>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(site.title)}</title>
  <subtitle>${esc(site.description)}</subtitle>
  <link href="${site.url}/feed.xml" rel="self" type="application/atom+xml" />
  <link href="${site.url}/" rel="alternate" type="text/html" />
  <id>${site.url}/feed.xml</id>
  <updated>${updated}</updated>
  <author><name>${esc(site.title)}</name></author>
${entries}
</feed>
`;
  return new Response(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
