import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { isAdmin } from "@/lib/auth";
import { LOCAL_ROOT, PARTS_ROOT, safeJoin, storageMode } from "@/lib/storage";

// Stand-in for R2 while developing without cloud credentials. Disabled whenever R2 is configured.

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

type Ctx = { params: Promise<{ key: string[] }> };

function disabled() {
  return storageMode() !== "local" || process.env.VERCEL;
}

export async function GET(request: Request, { params }: Ctx) {
  if (disabled()) return new Response("Not found", { status: 404 });
  const key = (await params).key.join("/");
  let file: string;
  try {
    file = safeJoin(LOCAL_ROOT, key);
  } catch {
    return new Response("Bad key", { status: 400 });
  }
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });

  const type = TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };

  // Video seeking needs byte ranges.
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start >= info.size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${info.size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(info.size) } });
}

export async function PUT(request: Request, { params }: Ctx) {
  if (disabled()) return new Response("Not found", { status: 404 });
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const key = (await params).key.join("/");
  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId");
  const partNumber = url.searchParams.get("partNumber");
  const body = new Uint8Array(await request.arrayBuffer());

  try {
    let dest: string;
    if (uploadId && partNumber) {
      dest = path.join(safeJoin(PARTS_ROOT, uploadId), String(Number(partNumber)));
    } else {
      dest = safeJoin(LOCAL_ROOT, key);
    }
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, body);
  } catch {
    return new Response("Bad key", { status: 400 });
  }
  const etag = `"${createHash("md5").update(body).digest("hex")}"`;
  return new Response(null, { status: 200, headers: { ETag: etag } });
}
