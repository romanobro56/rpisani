import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { getDb } from "@/db";
import { feedPostMedia, feedPosts, media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { toAdminMedia } from "@/lib/admin-media";
import { toDateInput } from "@/lib/format";

export const metadata = { title: "Edit post" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const db = await getDb();
  const [post] = await db.select().from(feedPosts).where(eq(feedPosts.id, id));
  if (!post) notFound();
  const rows = await db
    .select({ m: media })
    .from(feedPostMedia)
    .innerJoin(media, eq(feedPostMedia.mediaId, media.id))
    .where(eq(feedPostMedia.postId, id))
    .orderBy(asc(feedPostMedia.position));

  return (
    <PostEditor
      initial={{
        id: post.id,
        title: post.title,
        body: post.body,
        pinned: post.pinned,
        status: post.status,
        allowComments: post.allowComments,
        date: post.publishedAt ? toDateInput(post.publishedAt) : "",
        media: rows.map((r) => toAdminMedia(r.m)),
      }}
    />
  );
}
