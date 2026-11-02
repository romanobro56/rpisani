import parse from "html-react-parser";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comments } from "@/components/Comments";
import { DraftBanner } from "@/components/DraftBanner";
import { SiteShell } from "@/components/SiteShell";
import { isAdmin } from "@/lib/auth";
import { getBlogPostForPreview, getPublishedBlogPost } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return (await getPublishedBlogPost(slug)) ?? ((await isAdmin()) ? await getBlogPostForPreview(slug) : null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} | ${site.title}`,
    description: post.title,
    alternates: { canonical: `${site.url}/posts/${post.slug}/` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.publishedAt },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await load((await params).slug);
  if (!post) notFound();

  return (
    <SiteShell>
      {post.status === "draft" && <DraftBanner editHref={`/admin/blog/${post.id}/`} />}
      {/* Parsed rather than wrapped, so post markup stays a direct child of <section> as the theme CSS expects. */}
      {parse(post.bodyHtml)}
      {post.status === "published" && post.allowComments && <Comments type="blog" id={post.id} />}
    </SiteShell>
  );
}
