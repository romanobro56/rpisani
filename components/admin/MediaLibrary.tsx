"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { deleteMedia, deleteUnusedMedia, updateMediaAlt } from "@/app/actions/admin";
import type { AdminMedia } from "@/lib/admin-media";
import { formatBytes, formatDuration, formatShortDate } from "@/lib/format";
import type { MediaUse } from "@/lib/media-usage";
import { ACCEPT_WITH_AUDIO } from "@/lib/upload-client";
import { MediaThumb } from "./MediaThumb";
import { UploadTile } from "./UploadProgress";
import { useUploads } from "./useUploads";

type Item = AdminMedia & { usedBy: MediaUse[] };
type Filter = "all" | "image" | "video" | "audio" | "unused";

export function MediaLibrary({ items, storage }: { items: Item[]; storage: "r2" | "local" }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { uploads, add, dismiss } = useUploads(() => router.refresh());

  const visible = useMemo(
    () =>
      items.filter((m) =>
        filter === "all" ? true : filter === "unused" ? m.usedBy.length === 0 : m.kind === filter,
      ),
    [items, filter],
  );
  const totalBytes = items.reduce((n, m) => n + m.totalBytes, 0);
  const unusedCount = items.filter((m) => !m.usedBy.length).length;
  const current = items.find((m) => m.id === selected) ?? null;

  return (
    <>
      <div className="admin-head">
        <h1>Media</h1>
        <div className="admin-actions">
          <span className="admin-muted">
            {items.length} files · {formatBytes(totalBytes)} {storage === "r2" ? "in R2" : "on disk"}
          </span>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => fileInput.current?.click()}>
            <i className="fas fa-upload" aria-hidden="true"></i> Upload
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT_WITH_AUDIO}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <nav className="admin-tabs" aria-label="Filter media">
        {(["all", "image", "video", "audio", "unused"] as Filter[]).map((f) => (
          <button key={f} type="button" className={filter === f ? "is-active" : undefined} onClick={() => setFilter(f)}>
            {f === "all"
              ? "All"
              : f === "image"
                ? "Photos"
                : f === "video"
                  ? "Videos"
                  : f === "audio"
                    ? "Audio"
                    : `Unused (${unusedCount})`}
          </button>
        ))}
        {filter === "unused" && unusedCount > 0 && (
          <button
            type="button"
            className="admin-btn admin-btn--danger-text admin-tabs__end"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Permanently delete ${unusedCount} unused files from storage?`)) return;
              start(async () => {
                await deleteUnusedMedia();
                router.refresh();
              });
            }}
          >
            Delete all unused
          </button>
        )}
      </nav>

      <div className="media-grid media-grid--library">
        {uploads.map((u) => (
          <UploadTile key={u.key} item={u} onDismiss={() => dismiss(u.key)} />
        ))}
        {visible.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`media-tile media-tile--button${selected === m.id ? " is-selected" : ""}`}
            onClick={() => setSelected(m.id === selected ? null : m.id)}
          >
            <MediaThumb m={m} alt={m.alt} className="media-tile__img" />
            {m.kind !== "image" && (
              <span className="media-tile__badge">
                <i className={`fas ${m.kind === "audio" ? "fa-music" : "fa-play"}`} aria-hidden="true"></i>{" "}
                {formatDuration(m.durationSec)}
              </span>
            )}
            {!m.usedBy.length && <span className="media-tile__cover">Unused</span>}
          </button>
        ))}
      </div>
      {!visible.length && !uploads.length && <p className="admin-empty">No media here.</p>}

      {current && (
        <aside className="media-drawer" aria-label="Media details">
          <button type="button" className="media-drawer__close" onClick={() => setSelected(null)} aria-label="Close">
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </button>
          {current.kind === "video" ? (
            <video src={current.src} poster={current.poster ?? undefined} controls playsInline preload="metadata" />
          ) : current.kind === "audio" ? (
            <>
              <MediaThumb m={current} className="media-drawer__art" />
              <audio src={current.src} controls preload="metadata" />
            </>
          ) : (
            <img src={current.src} alt={current.alt} />
          )}
          <dl className="media-drawer__facts">
            <dt>File</dt>
            <dd>{current.filename}</dd>
            <dt>Size</dt>
            <dd>
              {current.width && current.height ? `${current.width}×${current.height} · ` : ""}
              {formatBytes(current.totalBytes)}
              {current.kind !== "image" && ` · ${formatDuration(current.durationSec)}`}
            </dd>
            <dt>Uploaded</dt>
            <dd>{formatShortDate(current.createdAt)}</dd>
            <dt>Used in</dt>
            <dd>
              {current.usedBy.length
                ? current.usedBy.map((u) => (
                    <a key={u.type + u.id} href={u.type === "feed" ? `/admin/posts/${u.id}/` : `/admin/blog/${u.id}/`}>
                      {u.type === "feed" ? "Post" : "Blog"}: {u.label}
                    </a>
                  ))
                : "Nothing yet"}
            </dd>
          </dl>
          <label className="admin-field">
            <span>{current.kind === "audio" ? "Track title" : current.kind === "video" ? "Description" : "Alt text"}</span>
            <input
              key={current.id}
              defaultValue={current.alt}
              maxLength={500}
              onBlur={(e) => {
                const alt = e.target.value;
                if (alt !== current.alt) start(async () => {
                  await updateMediaAlt(current.id, alt);
                  router.refresh();
                });
              }}
            />
          </label>
          <div className="media-drawer__actions">
            <button
              type="button"
              className="admin-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(new URL(current.src, location.href).href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger-text"
              disabled={pending}
              onClick={() => {
                const where = current.usedBy.length ? ` It will be removed from ${current.usedBy.length} post(s).` : "";
                if (!confirm(`Permanently delete ${current.filename}?${where}`)) return;
                start(async () => {
                  await deleteMedia(current.id);
                  setSelected(null);
                  router.refresh();
                });
              }}
            >
              Delete
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
