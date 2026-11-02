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
    background: #1e1e1e;
    border-color: #444;
    color: #e0e0e0;
  }
  .pagination button.active {
    background: #4a9eff;
    border-color: #4a9eff;
    color: #fff;
  }
  .pagination button:hover:not(.active) {
    background: #2a2a2a;
  }
}
`;

export default async function BlogPage() {
  const posts = (await getPublishedBlogPosts()).map((p) => ({ ...p, date: formatLongDate(p.publishedAt) }));
  return (
    <SiteShell>
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <BlogList posts={posts} />
    </SiteShell>
  );
}
