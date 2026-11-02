"use client";

import { useCallback, useRef, useState } from "react";
import type { AdminMedia } from "@/lib/admin-media";
import { uploadMedia } from "@/lib/upload-client";

export type UploadItem = {
  key: string;
  /** Selection order, so callers can place finished uploads in the order they were picked. */
  seq: number;
  file: File;
  preview: string | null;
  progress: number;
  label: string;
  error?: string;
};

const CONCURRENCY = 2;

/** A queue of files being prepared and uploaded, two at a time. */
export function useUploads(onUploaded: (media: AdminMedia, item: UploadItem) => void) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const queue = useRef<UploadItem[]>([]);
  const running = useRef(0);
  const seq = useRef(0);
  const callback = useRef(onUploaded);
  callback.current = onUploaded;

  const patch = useCallback((key: string, changes: Partial<UploadItem>) => {
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...changes } : u)));
  }, []);

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && queue.current.length) {
      const item = queue.current.shift()!;
      running.current++;
      uploadMedia(item.file, (progress, label) => patch(item.key, { progress, label }))
        .then((media) => {
          if (item.preview) URL.revokeObjectURL(item.preview);
          setUploads((list) => list.filter((u) => u.key !== item.key));
          callback.current(media, item);
        })
        .catch((err: unknown) => patch(item.key, { error: err instanceof Error ? err.message : "Upload failed", label: "Failed" }))
        .finally(() => {
          running.current--;
          pump();
        });
    }
  }, [patch]);

  const add = useCallback(
    (files: FileList | File[]) => {
      const items = Array.from(files).map((file) => ({
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        seq: seq.current++,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        label: "Waiting…",
      }));
      setUploads((list) => [...list, ...items]);
      queue.current.push(...items);
      pump();
    },
    [pump],
  );

  const dismiss = useCallback((key: string) => {
    setUploads((list) => list.filter((u) => u.key !== key));
  }, []);

  const busy = uploads.some((u) => !u.error);
  return { uploads, add, dismiss, busy };
}
