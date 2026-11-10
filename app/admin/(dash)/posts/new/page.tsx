import { PostEditor } from "@/components/admin/PostEditor";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  return <PostEditor />;
}
