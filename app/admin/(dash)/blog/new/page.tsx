import { BlogEditor } from "@/components/admin/BlogEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "New blog post" };

export default async function NewBlogPostPage() {
  await requireAdmin();
  return <BlogEditor />;
}
