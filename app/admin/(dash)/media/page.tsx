import { desc, eq } from "drizzle-orm";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { getDb } from "@/db";
import { media } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { toAdminMedia } from "@/lib/admin-media";
import { getMediaUsage } from "@/lib/media-usage";
import { storageMode } from "@/lib/storage";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requireAdmin();
  const db = await getDb();
  const [rows, usage] = await Promise.all([
    db.select().from(media).where(eq(media.status, "ready")).orderBy(desc(media.createdAt)),
    getMediaUsage(db),
  ]);
  const items = rows.map((r) => ({ ...toAdminMedia(r), usedBy: usage.get(r.id) ?? [] }));
  return <MediaLibrary items={items} storage={storageMode()} />;
}
