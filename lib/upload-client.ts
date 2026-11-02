"use client";

import {
  abortUpload,
  beginCoverUpload,
  beginUpload,
  completeUpload,
  setAudioCover,
  type UploadTarget,
} from "@/app/actions/uploads";
import type { AdminMedia } from "./admin-media";
import { MAX_AUDIO_SECONDS, MAX_VIDEO_SECONDS } from "./site";

// Everything heavy happens in the browser: resizing photos, grabbing a video frame for the poster,
// and uploading straight to storage in parallel chunks. The server only signs URLs and records results.

const DISPLAY_EDGE = 2048;
const THUMB_EDGE = 640;
const POSTER_EDGE = 1920;
const PARALLEL_PARTS = 4;
const RETRIES = 3;

export type Progress = (fraction: number, label: string) => void;

type PreparedFile = { role: UploadTarget["role"]; blob: Blob };
type Prepared = {
  kind: "image" | "video" | "audio";
  width: number | null;
  height: number | null;
  durationSec: number | null;
  files: PreparedFile[];
};

// ---- Images ---------------------------------------------------------------------------------

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  // Safari can't encode WebP and silently returns PNG; fall back to JPEG there.
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
  if (!jpeg) throw new Error("This browser couldn't encode the image.");
  return jpeg;
}

function drawScaled(source: CanvasImageSource, w: number, h: number, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function prepareImage(file: File): Promise<Prepared> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name}: this browser can't read that image format. Try Safari for HEIC, or export as JPEG.`);
  }
  const { width, height } = bitmap;
  // Re-encoding also strips EXIF (including GPS) from every copy that's published.
  const thumb = await encode(drawScaled(bitmap, width, height, THUMB_EDGE), 0.82);
  const files: PreparedFile[] = [{ role: "thumb", blob: thumb }];
  if (file.type === "image/gif") {
    // Keep animation: the GIF itself is the display copy.
    files.push({ role: "display", blob: file });
  } else {
    files.push({ role: "display", blob: await encode(drawScaled(bitmap, width, height, DISPLAY_EDGE), 0.86) });
    files.push({ role: "original", blob: file });
  }
  bitmap.close();
  return { kind: "image", width, height, durationSec: null, files };
}

// ---- Videos ---------------------------------------------------------------------------------

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    const timer = setTimeout(() => reject(new Error("Timed out reading the video.")), 30_000);
    video.onloadeddata = () => {
      clearTimeout(timer);
      resolve(video);
    };
    video.onerror = () => {
      clearTimeout(timer);
      reject(
        new Error(
          `${file.name}: this browser can't play that video, so visitors may not be able to either. Export it as H.264 MP4 and try again.`,
        ),
      );
    };
    video.src = URL.createObjectURL(file);
  });
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    // Some browsers never fire `seeked` for a paused, partly-buffered video; settle for the current frame.
    const timer = setTimeout(resolve, 5_000);
    video.onseeked = () => {
      clearTimeout(timer);
      resolve();
    };
    video.currentTime = time;
  });
}

async function prepareVideo(file: File): Promise<Prepared> {
  const video = await loadVideo(file);
  try {
    const duration = video.duration;
    if (!Number.isFinite(duration)) throw new Error(`${file.name}: couldn't read the video's length.`);
    if (duration > MAX_VIDEO_SECONDS + 1) {
      throw new Error(`${file.name} is ${Math.round(duration / 60)} minutes long. Videos can be up to 20 minutes.`);
    }
    await seek(video, Math.min(1, duration / 4));
    const { videoWidth: w, videoHeight: h } = video;
    const poster = await encode(drawScaled(video, w, h, POSTER_EDGE), 0.82);
    const thumb = await encode(drawScaled(video, w, h, THUMB_EDGE), 0.8);
    const cleaned = await stripVideoLocation(file);
    return {
      kind: "video",
      width: w || null,
      height: h || null,
      durationSec: duration,
      files: [
        { role: "video", blob: cleaned },
        { role: "poster", blob: poster },
        { role: "thumb", blob: thumb },
      ],
    };
  } finally {
    URL.revokeObjectURL(video.src);
  }
}

/**
 * Phones write the recording location into MP4/MOV metadata, and videos are published as uploaded.
 * This blanks every ISO 6709 coordinate string ("+40.7128-074.0060+010.000/") and the ©xyz atom
 * inside the small `moov` box, keeping byte lengths so the file stays valid. The media data is untouched.
 */
export async function stripVideoLocation(file: File): Promise<Blob> {
  if (!/\.(mp4|mov|m4v)$/i.test(file.name) && !/^video\/(mp4|quicktime)/.test(file.type)) return file;
  let offset = 0;
  while (offset + 8 <= file.size) {
    const head = new DataView(await file.slice(offset, offset + 16).arrayBuffer());
    let size = head.getUint32(0);
    const type = String.fromCharCode(head.getUint8(4), head.getUint8(5), head.getUint8(6), head.getUint8(7));
    if (size === 1) size = Number(head.getBigUint64(8));
    else if (size === 0) size = file.size - offset;
    if (size < 8) break;
    if (type === "moov" || type === "meta" || type === "udta") {
      if (size > 64 * 1024 * 1024) return file; // not a normal moov; leave it alone
      const bytes = new Uint8Array(await file.slice(offset, offset + size).arrayBuffer());
      if (scrubLocation(bytes)) {
        return new Blob([file.slice(0, offset), bytes, file.slice(offset + size)], { type: file.type });
      }
    }
    offset += size;
  }
  return file;
}

function scrubLocation(bytes: Uint8Array): boolean {
  let changed = false;
  // ©xyz atom (QuickTime user data): rename to 'free' so players skip it.
  for (let i = 0; i + 4 <= bytes.length; i++) {
    if (bytes[i] === 0xa9 && bytes[i + 1] === 0x78 && bytes[i + 2] === 0x79 && bytes[i + 3] === 0x7a) {
      bytes.set([0x66, 0x72, 0x65, 0x65], i);
      changed = true;
    }
  }
  // ISO 6709 strings, used by both ©xyz and com.apple.quicktime.location.ISO6709.
  const text = new TextDecoder("latin1").decode(bytes);
  const iso6709 = /[+-]\d{2}\.\d{2,}[+-]\d{3}\.\d{2,}(?:[+-]\d+(?:\.\d+)?)?\/?/g;
  for (const m of text.matchAll(iso6709)) {
    const blank = m[0].replace(/\d/g, "0");
    for (let j = 0; j < blank.length; j++) bytes[m.index! + j] = blank.charCodeAt(j);
    changed = true;
  }
  return changed;
}

// ---- Audio ----------------------------------------------------------------------------------

const COVER_EDGE = 640;
const AUDIO_TYPE: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg" };

/** Browsers disagree on audio MIME types (audio/x-m4a, audio/mp3, ...); map them to the ones storage accepts. */
function audioType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (AUDIO_TYPE[ext]) return AUDIO_TYPE[ext];
  if (/mpeg|mp3/.test(file.type)) return "audio/mpeg";
  if (/mp4|m4a|aac/.test(file.type)) return "audio/mp4";
  if (/wav/.test(file.type)) return "audio/wav";
  if (/ogg/.test(file.type)) return "audio/ogg";
  return file.type;
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    const done = () => URL.revokeObjectURL(url);
    const timer = setTimeout(() => {
      done();
      reject(new Error("Timed out reading the audio."));
    }, 30_000);
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      done();
      if (Number.isFinite(audio.duration)) resolve(audio.duration);
      else reject(new Error(`${file.name}: couldn't read the audio's length.`));
    };
    audio.onerror = () => {
      clearTimeout(timer);
      done();
      reject(new Error(`${file.name}: this browser can't play that audio. Export it as MP3 and try again.`));
    };
    audio.src = url;
  });
}

/** Pulls the album art (the ID3v2.3/2.4 APIC frame) out of an MP3, if there is one. */
async function readId3Cover(file: File): Promise<Blob | null> {
  const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (head.length < 10 || head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null; // "ID3"
  const version = head[3];
  if (version !== 3 && version !== 4) return null;
  if (head[5] & 0x80) return null; // unsynchronised tags are rare; skip them
  const syncsafe = (b: Uint8Array, i: number) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
  const tagSize = syncsafe(head, 6);
  if (tagSize > 20 * 1024 * 1024) return null;
  const tag = new Uint8Array(await file.slice(10, 10 + tagSize).arrayBuffer());
  const view = new DataView(tag.buffer);
  let i = head[5] & 0x40 ? (version === 4 ? syncsafe(tag, 0) : view.getUint32(0) + 4) : 0; // extended header
  while (i + 10 <= tag.length) {
    const id = String.fromCharCode(tag[i], tag[i + 1], tag[i + 2], tag[i + 3]);
    if (!/^[A-Z0-9]{4}$/.test(id)) break; // padding
    const size = version === 4 ? syncsafe(tag, i + 4) : view.getUint32(i + 4);
    const start = i + 10;
    if (id === "APIC" && start + size <= tag.length) {
      const frame = tag.subarray(start, start + size);
      const encoding = frame[0];
      let p = 1;
      let mime = "";
      while (p < frame.length && frame[p] !== 0) mime += String.fromCharCode(frame[p++]);
      p += 2; // terminator, picture type
      // Description: one zero byte ends it in Latin-1/UTF-8, two in UTF-16.
      if (encoding === 1 || encoding === 2) {
        while (p + 1 < frame.length && (frame[p] !== 0 || frame[p + 1] !== 0)) p += 2;
        p += 2;
      } else {
        while (p < frame.length && frame[p] !== 0) p++;
        p += 1;
      }
      if (p >= frame.length) return null;
      const type = mime.includes("/") ? mime : `image/${mime.toLowerCase() === "png" ? "png" : "jpeg"}`;
      return new Blob([frame.slice(p)], { type });
    }
    i = start + size;
  }
  return null;
}

/** A small, square-cropped cover. Re-encoding drops any metadata in the source image. */
async function makeCover(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(COVER_EDGE, side);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = out;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
  bitmap.close();
  return encode(canvas, 0.85);
}

async function prepareAudio(file: File): Promise<Prepared> {
  const duration = await readDuration(file);
  if (duration > MAX_AUDIO_SECONDS + 1) {
    throw new Error(`${file.name} is ${Math.round(duration / 60)} minutes long. Audio can be up to ${MAX_AUDIO_SECONDS / 60} minutes.`);
  }
  const files: PreparedFile[] = [{ role: "audio", blob: new Blob([file], { type: audioType(file) }) }];
  const art = await readId3Cover(file).catch(() => null);
  if (art) {
    const cover = await makeCover(art).catch(() => null);
    if (cover) files.push({ role: "thumb", blob: cover });
  }
  return { kind: "audio", width: null, height: null, durationSec: duration, files };
}

/** Uploads an image as the cover art of an audio file and returns the updated media. */
export async function uploadAudioCover(mediaId: string, file: File): Promise<AdminMedia> {
  let cover: Blob;
  try {
    cover = await makeCover(file);
  } catch {
    throw new Error(`${file.name}: this browser can't read that image format.`);
  }
  const begin = await beginCoverUpload(mediaId, cover.type, cover.size);
  if ("error" in begin) throw new Error(begin.error);
  await withRetry(() => put(begin.url, cover, cover.type, () => {}));
  const done = await setAudioCover(mediaId, begin.key);
  if ("error" in done) throw new Error(done.error);
  return done.media;
}

export async function removeAudioCover(mediaId: string): Promise<AdminMedia> {
  const done = await setAudioCover(mediaId, null);
  if ("error" in done) throw new Error(done.error);
  return done.media;
}

// ---- Upload transport -----------------------------------------------------------------------

function put(url: string, body: Blob, contentType: string | null, onProgress: (loaded: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag") ?? "");
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check the bucket's CORS settings."));
    xhr.send(body);
  });
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  throw last;
}

/** Prepares and uploads one file, reporting progress, and returns the stored media. */
export async function uploadMedia(file: File, onProgress: Progress): Promise<AdminMedia> {
  const kind = mediaKindOf(file);
  onProgress(0, kind === "video" ? "Reading video…" : kind === "audio" ? "Reading audio…" : "Resizing…");
  const prepared =
    kind === "video" ? await prepareVideo(file) : kind === "audio" ? await prepareAudio(file) : await prepareImage(file);

  const contentTypeOf = (b: Blob) => b.type || (kind === "video" ? "video/mp4" : "image/jpeg");
  const begin = await beginUpload({
    kind,
    filename: file.name,
    width: prepared.width,
    height: prepared.height,
    durationSec: prepared.durationSec,
    files: prepared.files.map((f) => ({ role: f.role, contentType: contentTypeOf(f.blob), size: f.blob.size })),
  });
  if ("error" in begin) throw new Error(begin.error);

  const total = prepared.files.reduce((n, f) => n + f.blob.size, 0);
  const loaded = new Map<string, number>();
  const report = (id: string, n: number) => {
    loaded.set(id, n);
    const sum = [...loaded.values()].reduce((a, b) => a + b, 0);
    onProgress(Math.min(0.99, sum / total), "Uploading…");
  };

  const multiparts: { key: string; uploadId: string; parts: { partNumber: number; etag: string }[] }[] = [];
  try {
    for (const target of begin.targets) {
      const blob = prepared.files.find((f) => f.role === target.role)!.blob;
      if (target.method === "put") {
        await withRetry(() => put(target.url, blob, target.contentType, (n) => report(target.key, n)));
        continue;
      }
      const parts: { partNumber: number; etag: string }[] = [];
      let next = 0;
      const worker = async () => {
        while (next < target.urls.length) {
          const i = next++;
          const chunk = blob.slice(i * target.partSize, (i + 1) * target.partSize);
          const etag = await withRetry(() => put(target.urls[i], chunk, null, (n) => report(`${target.key}#${i}`, n)));
          if (!etag) throw new Error("Storage didn't return an ETag. Expose the ETag header in the bucket's CORS settings.");
          parts.push({ partNumber: i + 1, etag });
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, target.urls.length) }, worker));
      multiparts.push({ key: target.key, uploadId: target.uploadId, parts });
    }
  } catch (err) {
    const pending = begin.targets.flatMap((t) => (t.method === "multipart" ? [{ key: t.key, uploadId: t.uploadId }] : []));
    await abortUpload(begin.mediaId, pending).catch(() => {});
    throw err;
  }

  onProgress(0.995, "Finishing…");
  const done = await completeUpload({ mediaId: begin.mediaId, multiparts });
  if ("error" in done) throw new Error(done.error);
  onProgress(1, "Done");
  return done.media;
}

export function mediaKindOf(file: File): "image" | "video" | "audio" {
  if (file.type.startsWith("audio/") || /\.(mp3|m4a|wav|ogg)$/i.test(file.name)) return "audio";
  if (file.type.startsWith("video/") || /\.(mov|mp4|m4v|webm)$/i.test(file.name)) return "video";
  return "image";
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif";
const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm";
const AUDIO_ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,.mp3,.m4a,.wav,.ogg";

/** Photos and videos (blog posts). */
export const ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;
/** Photos, videos, and audio (feed posts). */
export const ACCEPT_WITH_AUDIO = `${ACCEPT},${AUDIO_ACCEPT}`;
export const ACCEPT_IMAGES = IMAGE_ACCEPT;
