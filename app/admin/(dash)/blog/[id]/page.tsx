import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { getDb } from "@/db";
import { blogPosts } from "@/db/schema";
import { toDateInput } from "@/lib/format";

export const metadata = { title: "Edit blog post" };

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await getDb();
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  if (!post) notFound();
  return (
    <BlogEditor
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        readTime: post.readTime ?? "",
        date: post.publishedAt ? toDateInput(post.publishedAt) : "",
        allowComments: post.allowComments,
        status: post.status,
      }}
    />
  );
}
