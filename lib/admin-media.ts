import { media } from "@/db/schema";
import { mediaUrl } from "./storage";

/** What the admin UI needs to show and reorder a piece of media. */
export type AdminMedia = {
  id: string;
  kind: "image" | "video" | "audio";
  filename: string;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  alt: string;
  totalBytes: number;
  src: string;
  /** Empty for audio without cover art. */
  thumb: string;
  poster: string | null;
  createdAt: string;
};

export function toAdminMedia(m: typeof media.$inferSelect): AdminMedia {
  const k = m.keys;
  const main = m.kind === "video" ? k.video : m.kind === "audio" ? k.audio : k.display;
  const thumb = k.thumb ?? k.poster ?? k.display;
  return {
    id: m.id,
    kind: m.kind,
    filename: m.filename,
    width: m.width,
    height: m.height,
    durationSec: m.durationSec,
    alt: m.alt,
    totalBytes: m.totalBytes,
    src: main ? mediaUrl(main) : "",
    thumb: thumb ? mediaUrl(thumb) : "",
    poster: k.poster ? mediaUrl(k.poster) : null,
    createdAt: m.createdAt.toISOString(),
  };
}
