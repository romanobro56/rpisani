import type { Metadata } from "next";
import { BlogList } from "@/components/BlogList";
import { SiteShell } from "@/components/SiteShell";
import { formatLongDate } from "@/lib/format";
import { getPublishedBlogPosts } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `Blog | ${site.title}`, description: "Blog" };

// Same styles the Jekyll blog page carried inline.
const pageStyles = `
.blog-page .pub-row {
  margin-bottom: 20px;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 30px;
}
.pagination button {
  padding: 6px 14px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
}
.pagination button.active {
  background: #0066cc;
  color: #fff;
  border-color: #0066cc;
}
.pagination button:hover:not(.active) {
  background: #f0f0f0;
}
@media (prefers-color-scheme: dark) {
  .pagination button {
    background: var(--dk-sunken);
    border-color: var(--dk-border);
    color: var(--dk-text);
  }
  .pagination button.active {
    background: var(--dk-accent);
    border-color: var(--dk-accent);
    color: var(--dk-on-accent);
  }
  .pagination button:hover:not(.active) {
    background: var(--dk-surface);
  }
}
`;

export default async function BlogPage() {
  const posts = (await getPublishedBlogPosts()).map((p) => ({ ...p, date: formatLongDate(p.publishedAt) }));
  return (
    <SiteShell>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <p>
        <a href="/">← Back to Home</a>
      </p>
      <BlogList posts={posts} />
    </SiteShell>
  );
}
