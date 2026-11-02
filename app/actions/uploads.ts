"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { media, type MediaKeys } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { MAX_AUDIO_SECONDS, MAX_VIDEO_SECONDS } from "@/lib/site";
import { TAGS } from "@/lib/queries";
import { getStorage } from "@/lib/storage";
import { type AdminMedia, toAdminMedia } from "@/lib/admin-media";

const MB = 1024 * 1024;
const MULTIPART_THRESHOLD = 48 * MB;
const PART_SIZE = 16 * MB; // R2 needs equal parts (except the last) of at least 5 MB

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"];

// Each upload is a set of files: the source plus the sizes generated in the browser.
const ROLE_RULES: Record<keyof MediaKeys, { types: string[]; maxBytes: number; ext?: string }> = {
  original: { types: IMAGE_TYPES, maxBytes: 80 * MB },
  display: { types: ["image/webp", "image/jpeg", "image/gif"], maxBytes: 25 * MB },
  thumb: { types: ["image/webp", "image/jpeg"], maxBytes: 5 * MB },
  poster: { types: ["image/webp", "image/jpeg"], maxBytes: 10 * MB },
  video: { types: VIDEO_TYPES, maxBytes: 8 * 1024 * MB },
  audio: { types: AUDIO_TYPES, maxBytes: 1024 * MB },
};

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

const beginSchema = z.object({
  kind: z.enum(["image", "video", "audio"]),
  filename: z.string().min(1).max(200),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
  durationSec: z.number().nonnegative().nullable(),
  files: z
    .array(
      z.object({
        role: z.enum(["original", "display", "thumb", "poster", "video", "audio"]),
        contentType: z.string(),
        size: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(4),
});

export type UploadTarget =
  | { role: keyof MediaKeys; key: string; method: "put"; url: string; contentType: string }
  | {
      role: keyof MediaKeys;
      key: string;
      method: "multipart";
      uploadId: string;
      partSize: number;
      urls: string[];
      contentType: string;
    };

export async function beginUpload(
  input: z.infer<typeof beginSchema>,
): Promise<{ mediaId: string; targets: UploadTarget[] } | { error: string }> {
  await requireAdmin();
  const parsed = beginSchema.safeParse(input);
  if (!parsed.success) return { error: "That file couldn't be prepared for upload." };
  const { kind, filename, width, height, durationSec, files } = parsed.data;

  const roles = new Set(files.map((f) => f.role));
  if (kind === "image" && !roles.has("display")) return { error: "Missing web-sized image." };
  if (kind === "video") {
    if (!roles.has("video")) return { error: "Missing video file." };
    if (durationSec === null || durationSec > MAX_VIDEO_SECONDS + 1) {
      return { error: `Videos can be up to ${MAX_VIDEO_SECONDS / 60} minutes long.` };
    }
  }
  if (kind === "audio") {
    if (!roles.has("audio")) return { error: "Missing audio file." };
    if (durationSec === null || durationSec > MAX_AUDIO_SECONDS + 1) {
      return { error: `Audio can be up to ${MAX_AUDIO_SECONDS / 60} minutes long.` };
    }
  }
  for (const f of files) {
    const rule = ROLE_RULES[f.role];
    if (!rule.types.includes(f.contentType)) return { error: `Unsupported file type: ${f.contentType}` };
    if (f.size > rule.maxBytes) return { error: `${filename} is too large.` };
  }

  const mediaId = newId();
  // Originals sit under a separate random prefix that is never published, so they can't be guessed from a public URL.
  const originalPrefix = `o/${newId(24)}`;
  const keys: MediaKeys = {};
  for (const f of files) {
    const ext = EXT[f.contentType];
    keys[f.role] = f.role === "original" ? `${originalPrefix}/original.${ext}` : `m/${mediaId}/${f.role}.${ext}`;
  }

  const storage = getStorage();
  const targets: UploadTarget[] = [];
  for (const f of files) {
    const key = keys[f.role]!;
    if (f.size > MULTIPART_THRESHOLD) {
      const uploadId = await storage.createMultipart(key, f.contentType);
      const count = Math.ceil(f.size / PART_SIZE);
      const urls = await Promise.all(
        Array.from({ length: count }, (_, i) => storage.presignPart(key, uploadId, i + 1)),
      );
      targets.push({ role: f.role, key, method: "multipart", uploadId, partSize: PART_SIZE, urls, contentType: f.contentType });
    } else {
      targets.push({ role: f.role, key, method: "put", url: await storage.presignPut(key, f.contentType), contentType: f.contentType });
    }
  }

  const db = await getDb();
  await db.insert(media).values({
    id: mediaId,
    kind,
    status: "uploading",
    filename: filename.slice(0, 200),
    mimeType: files.find((f) => f.role === (kind === "image" ? "original" : kind))?.contentType ?? files[0].contentType,
    width,
    height,
    durationSec,
    keys,
  });
  return { mediaId, targets };
}

const completeSchema = z.object({
  mediaId: z.string().min(1).max(64),
  multiparts: z.array(
    z.object({
      key: z.string(),
      uploadId: z.string(),
      parts: z.array(z.object({ partNumber: z.number().int().positive(), etag: z.string() })),
    }),
  ),
});

export async function completeUpload(
  input: z.infer<typeof completeSchema>,
): Promise<{ media: AdminMedia } | { error: string }> {
  await requireAdmin();
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid upload." };
  const { mediaId, multiparts } = parsed.data;

  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row) return { error: "Upload not found." };
  const keys = Object.values(row.keys).filter(Boolean) as string[];

  const storage = getStorage();
  for (const mp of multiparts) {
    if (!keys.includes(mp.key)) return { error: "Invalid upload." };
    await storage.completeMultipart(mp.key, mp.uploadId, mp.parts);
  }

  // Confirm every object actually landed before the media can be used.
  let total = 0;
  for (const key of keys) {
    const size = await storage.size(key);
    if (size === null) return { error: "Part of the upload is missing. Please try again." };
    total += size;
  }

  const [updated] = await db
    .update(media)
    .set({ status: "ready", totalBytes: total })
    .where(eq(media.id, mediaId))
    .returning();
  return { media: toAdminMedia(updated) };
}

/** Cleans up after a failed or cancelled upload. */
export async function abortUpload(mediaId: string, multiparts: { key: string; uploadId: string }[] = []): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row || row.status !== "uploading") return;
  const storage = getStorage();
  const keys = Object.values(row.keys).filter(Boolean) as string[];
  await Promise.all(
    multiparts.filter((mp) => keys.includes(mp.key)).map((mp) => storage.abortMultipart(mp.key, mp.uploadId).catch(() => {})),
  );
  await storage.remove(keys).catch(() => {});
  await db.delete(media).where(eq(media.id, mediaId));
}

// ---- Audio cover art ------------------------------------------------------------------------

/** Signs an upload for a new cover image on an audio file. Each cover gets a fresh key, so caches never show the old one. */
export async function beginCoverUpload(
  mediaId: string,
  contentType: string,
  size: number,
): Promise<{ key: string; url: string } | { error: string }> {
  await requireAdmin();
  const rule = ROLE_RULES.thumb;
  if (!rule.types.includes(contentType) || size > rule.maxBytes) return { error: "That image can't be used as a cover." };
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row || row.kind !== "audio") return { error: "Audio not found." };
  const key = `m/${mediaId}/cover-${newId(8)}.${EXT[contentType]}`;
  return { key, url: await getStorage().presignPut(key, contentType) };
}

/** Sets (key) or removes (null) the cover image of an audio file, deleting the old one from storage. */
export async function setAudioCover(mediaId: string, key: string | null): Promise<{ media: AdminMedia } | { error: string }> {
  await requireAdmin();
  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, mediaId));
  if (!row || row.kind !== "audio") return { error: "Audio not found." };
  if (key !== null && !key.startsWith(`m/${mediaId}/cover-`)) return { error: "Invalid cover." };

  const storage = getStorage();
  const coverBytes = key ? await storage.size(key) : 0;
  if (coverBytes === null) return { error: "The cover didn't finish uploading. Please try again." };
  const old = row.keys.thumb;
  const oldBytes = old ? ((await storage.size(old)) ?? 0) : 0;
  const keys: MediaKeys = { ...row.keys, thumb: key ?? undefined };
  if (!key) delete keys.thumb;

  const [updated] = await db
    .update(media)
    .set({ keys, totalBytes: Math.max(0, row.totalBytes - oldBytes + coverBytes) })
    .where(eq(media.id, mediaId))
    .returning();
  if (old && old !== key) await storage.remove([old]).catch(() => {});
  revalidateTag(TAGS.feed, { expire: 0 });
  return { media: toAdminMedia(updated) };
}
