import "server-only";
import { mkdir, readdir, readFile, rm, stat, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { newId } from "./ids";

/**
 * Media lives in Cloudflare R2 (S3-compatible, no egress fees). Browsers upload straight to the
 * bucket with presigned URLs, so large videos never pass through a serverless function.
 * Without R2 settings, development falls back to files under .data/uploads served by /api/dev-storage.
 */
export interface Storage {
  presignPut(key: string, contentType: string): Promise<string>;
  createMultipart(key: string, contentType: string): Promise<string>;
  presignPart(key: string, uploadId: string, partNumber: number): Promise<string>;
  completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]): Promise<void>;
  abortMultipart(key: string, uploadId: string): Promise<void>;
  size(key: string): Promise<number | null>;
  remove(keys: string[]): Promise<void>;
}

const UPLOAD_TTL_SECONDS = 6 * 60 * 60;

function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET,
  );
}

export function storageMode(): "r2" | "local" {
  return r2Configured() ? "r2" : "local";
}

/** Public URL for a stored object. Safe to call from any server code. */
export function mediaUrl(key: string): string {
  if (storageMode() === "local") return `/api/dev-storage/${key}`;
  const base = process.env.MEDIA_PUBLIC_URL ?? process.env.NEXT_PUBLIC_MEDIA_URL ?? "";
  return `${base.replace(/\/$/, "")}/${key}`;
}

class R2Storage implements Storage {
  private client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // Newer SDKs add CRC32 checksum params to presigned URLs, which browser PUTs can't satisfy.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  private bucket = process.env.R2_BUCKET!;

  presignPut(key: string, contentType: string) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: UPLOAD_TTL_SECONDS },
    );
  }

  async createMultipart(key: string, contentType: string) {
    const res = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    if (!res.UploadId) throw new Error("R2 did not return an upload id");
    return res.UploadId;
  }

  presignPart(key: string, uploadId: string, partNumber: number) {
    return getSignedUrl(
      this.client,
      new UploadPartCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId, PartNumber: partNumber }),
      { expiresIn: UPLOAD_TTL_SECONDS },
    );
  }

  async completeMultipart(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: [...parts].sort((a, b) => a.partNumber - b.partNumber).map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
        },
      }),
    );
  }

  async abortMultipart(key: string, uploadId: string) {
    await this.client.send(new AbortMultipartUploadCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId }));
  }

  async size(key: string) {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return res.ContentLength ?? null;
    } catch {
      return null;
    }
  }

  async remove(keys: string[]) {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }),
    );
  }
}

// ---- Local development storage -------------------------------------------------------------

export const LOCAL_ROOT = path.join(process.cwd(), ".data/uploads");
const PARTS_ROOT = path.join(process.cwd(), ".data/upload-parts");

/** Resolves a key inside a root directory, refusing anything that escapes it. */
export function safeJoin(root: string, key: string): string {
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

class LocalStorage implements Storage {
  async presignPut(key: string) {
    return `/api/dev-storage/${key}`;
  }

  async createMultipart() {
    const uploadId = newId(16);
    await mkdir(safeJoin(PARTS_ROOT, uploadId), { recursive: true });
    return uploadId;
  }

  async presignPart(key: string, uploadId: string, partNumber: number) {
    return `/api/dev-storage/${key}?uploadId=${uploadId}&partNumber=${partNumber}`;
  }

  async completeMultipart(key: string, uploadId: string, parts: { partNumber: number }[]) {
    const dir = safeJoin(PARTS_ROOT, uploadId);
    const dest = safeJoin(LOCAL_ROOT, key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, new Uint8Array());
    for (const p of [...parts].sort((a, b) => a.partNumber - b.partNumber)) {
      await appendFile(dest, await readFile(path.join(dir, String(p.partNumber))));
    }
    await rm(dir, { recursive: true, force: true });
  }

  async abortMultipart(_key: string, uploadId: string) {
    await rm(safeJoin(PARTS_ROOT, uploadId), { recursive: true, force: true });
  }

  async size(key: string) {
    try {
      return (await stat(safeJoin(LOCAL_ROOT, key))).size;
    } catch {
      return null;
    }
  }

  async remove(keys: string[]) {
    for (const key of keys) {
      const file = safeJoin(LOCAL_ROOT, key);
      await rm(file, { force: true });
      // Tidy the now-empty media folder.
      const dir = path.dirname(file);
      if (dir !== LOCAL_ROOT && !(await readdir(dir).catch(() => ["x"])).length) await rm(dir, { recursive: true });
    }
  }
}

export { PARTS_ROOT };

let instance: Storage | undefined;
export function getStorage(): Storage {
  if (instance) return instance;
  if (r2Configured()) {
    instance = new R2Storage();
  } else if (process.env.VERCEL) {
    throw new Error("R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.");
  } else {
    instance = new LocalStorage();
  }
  return instance;
}
