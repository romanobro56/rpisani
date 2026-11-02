"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { deleteFeedPost, saveFeedPost } from "@/app/actions/admin";
import type { AdminMedia } from "@/lib/admin-media";
import { formatDuration } from "@/lib/format";
import { ACCEPT_IMAGES, ACCEPT_WITH_AUDIO, removeAudioCover, uploadAudioCover } from "@/lib/upload-client";
import { MediaThumb } from "./MediaThumb";
import { UploadTile } from "./UploadProgress";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useUploads } from "./useUploads";

type Initial = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  status: "draft" | "published";
  allowComments: boolean;
  date: string;
  media: AdminMedia[];
};

const MAX_BODY = 5000;
const MAX_MEDIA = 20;

export function PostEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [items, setItems] = useState<AdminMedia[]>(initial?.media ?? []);
  const [allowComments, setAllowComments] = useState(initial?.allowComments ?? true);
  const [date, setDate] = useState(initial?.date ?? "");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [coverFor, setCoverFor] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState<string | null>(null);

  const touch = () => {
    setDirty(true);
    setMessage(null);
  };

  // Uploads finish in any order; slot each one in by the order the files were picked.
  const uploadSeq = useRef(new Map<string, number>());
  const { uploads, add, dismiss, busy } = useUploads((m, item) => {
    uploadSeq.current.set(m.id, item.seq);
    setItems((list) => {
      const at = list.findIndex((x) => (uploadSeq.current.get(x.id) ?? -1) > item.seq);
      return at === -1 ? [...list, m] : [...list.slice(0, at), m, ...list.slice(at)];
    });
    touch();
  });

  const addFiles = (files: FileList | File[]) => {
    const room = MAX_MEDIA - items.length - uploads.length;
    const list = Array.from(files);
    if (list.length > room) setMessage({ kind: "error", text: `A post can hold up to ${MAX_MEDIA} media files.` });
    if (room > 0) add(list.slice(0, room));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    setItems((list) => {
      const next = [...list];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    touch();
  };

  // Cover art is saved on the audio file straight away, like an upload.
  const changeCover = async (mediaId: string, file: File | null) => {
    setCoverBusy(mediaId);
    setMessage(null);
    try {
      const updated = file ? await uploadAudioCover(mediaId, file) : await removeAudioCover(mediaId);
      setItems((list) => list.map((x) => (x.id === mediaId ? { ...updated, alt: x.alt } : x)));
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Couldn't update the cover." });
    } finally {
      setCoverBusy(null);
    }
  };

  const save = useCallback(
    (intent: "draft" | "publish" | "unpublish") => {
      if (busy) {
        setMessage({ kind: "error", text: "Wait for uploads to finish before saving." });
        return;
      }
      startSaving(async () => {
        const res = await saveFeedPost({
          id,
          title,
          body,
          pinned,
          mediaIds: items.map((m) => m.id),
          alts: Object.fromEntries(items.map((m) => [m.id, m.alt])),
          allowComments,
          date: date || null,
          intent,
        });
        if (!res.ok) {
          setMessage({ kind: "error", text: res.error });
          return;
        }
        setStatus(res.status);
        setDirty(false);
        setMessage({
          kind: "ok",
          text: intent === "publish" ? "Published." : intent === "unpublish" ? "Moved back to drafts." : "Saved.",
        });
        if (!id) {
          setId(res.id);
          router.replace(`/admin/posts/${res.id}/`);
        } else {
          router.refresh();
        }
      });
    },
    [busy, id, title, body, pinned, items, allowComments, date, router],
  );

  useUnsavedGuard(dirty || busy, () => save(status === "published" ? "publish" : "draft"));

  const remove = async () => {
    if (!id) return router.push("/admin/posts/");
    if (!confirm("Delete this post? Its media is deleted too, unless another post uses it.")) return;
    startSaving(async () => {
      await deleteFeedPost(id);
      setDirty(false);
      router.push("/admin/posts/");
    });
  };

  const visual = items.filter((m) => m.kind !== "audio");
  const coverId = visual.length > 1 ? visual[0].id : null;
  const empty = !title.trim() && !body.trim() && !items.length;

  return (
    <div className="editor">
      <div className="admin-head">
        <h1>{id ? "Edit post" : "New post"}</h1>
        <div className="admin-actions">
          <span className={`badge-status badge-status--${status}`}>{status === "draft" ? "Draft" : "Published"}</span>
          {id && (
            <a className="admin-btn" href={`/feed/${id}/`} target="_blank" rel="noopener">
              {status === "published" ? "View" : "Preview"} <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
            </a>
          )}
        </div>
      </div>

      <div className="admin-card">
        <label className="admin-field">
          <span>Title</span>
          <input
            className="editor__title"
            value={title}
            maxLength={200}
            placeholder="Optional. Shown as a heading above the text."
            onChange={(e) => {
              setTitle(e.target.value);
              touch();
            }}
          />
        </label>

        <label className="admin-field">
          <span>Text</span>
          <textarea
            className="editor__body"
            value={body}
            maxLength={MAX_BODY}
            rows={5}
            placeholder="What’s happening? (Optional if you add a title or media.) Links become clickable."
            onChange={(e) => {
              setBody(e.target.value);
              touch();
            }}
          />
          <span className="admin-field__hint">
            {body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
          </span>
        </label>

        <div className="admin-field">
          <span>Photos, videos &amp; audio</span>
          <div
            className={`media-grid${dropActive ? " is-drop" : ""}`}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                setDropActive(true);
              }
            }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(e) => {
              setDropActive(false);
              if (e.dataTransfer.files.length) {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }
            }}
          >
            {items.map((m, i) => (
              <div
                key={m.id}
                className={`media-tile${dragging === i ? " is-dragging" : ""}`}
                draggable
                onDragStart={(e) => {
                  setDragging(i);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => {
                  if (dragging !== null) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (dragging === null) return;
                  e.preventDefault();
                  e.stopPropagation();
                  move(dragging, i);
                  setDragging(null);
                }}
              >
                <MediaThumb m={m} className="media-tile__img" />
                {m.kind !== "image" && (
                  <span className="media-tile__badge">
                    <i className={`fas ${m.kind === "audio" ? "fa-music" : "fa-play"}`} aria-hidden="true"></i>{" "}
                    {formatDuration(m.durationSec)}
                  </span>
                )}
                {m.id === coverId && <span className="media-tile__cover">Cover</span>}
                <div className="media-tile__tools">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                    <i className="fas fa-arrow-left" aria-hidden="true"></i>
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move later">
                    <i className="fas fa-arrow-right" aria-hidden="true"></i>
                  </button>
                  {m.kind === "audio" && (
                    <button
                      type="button"
                      disabled={coverBusy === m.id}
                      onClick={() => {
                        setCoverFor(m.id);
                        coverInput.current?.click();
                      }}
                      aria-label={m.thumb ? "Change cover image" : "Add cover image"}
                      title={m.thumb ? "Change cover image" : "Add cover image"}
                    >
                      <i className={`fas ${coverBusy === m.id ? "fa-spinner fa-spin" : "fa-image"}`} aria-hidden="true"></i>
                    </button>
                  )}
                  {m.kind === "audio" && m.thumb && (
                    <button
                      type="button"
                      disabled={coverBusy === m.id}
                      onClick={() => changeCover(m.id, null)}
                      aria-label="Remove cover image"
                      title="Remove cover image"
                    >
                      <i className="fas fa-xmark" aria-hidden="true"></i>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setItems((list) => list.filter((x) => x.id !== m.id));
                      touch();
                    }}
                    aria-label="Remove from post"
                  >
                    <i className="fas fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
                <input
                  className="media-tile__alt"
                  placeholder={m.kind === "audio" ? "Track title" : m.kind === "video" ? "Description" : "Alt text"}
                  value={m.alt}
                  maxLength={500}
                  aria-label={`Description for ${m.filename}`}
                  onChange={(e) => {
                    const alt = e.target.value;
                    setItems((list) => list.map((x) => (x.id === m.id ? { ...x, alt } : x)));
                    touch();
                  }}
                />
              </div>
            ))}
            {uploads.map((u) => (
              <UploadTile key={u.key} item={u} onDismiss={() => dismiss(u.key)} />
            ))}
            {items.length + uploads.length < MAX_MEDIA && (
              <button type="button" className="media-add" onClick={() => fileInput.current?.click()}>
                <i className="fas fa-plus" aria-hidden="true"></i>
                <span>Add photos, videos, or audio</span>
                <span className="admin-muted admin-small">or drop files here</span>
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT_WITH_AUDIO}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={coverInput}
            type="file"
            accept={ACCEPT_IMAGES}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && coverFor) void changeCover(coverFor, file);
              e.target.value = "";
            }}
          />
          <span className="admin-field__hint">
            Drag to reorder; the first photo or video is the cover. Videos up to 20 minutes (MP4/H.264 plays everywhere).
            Audio (MP3, M4A, WAV) up to an hour plays above the photos; MP3 album art becomes its cover, or add one with
            the image button.
          </span>
        </div>

        <div className="editor__options">
          <label className="admin-field admin-field--inline">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                touch();
              }}
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => {
                setPinned(e.target.checked);
                touch();
              }}
            />
            Pin to top of feed
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => {
                setAllowComments(e.target.checked);
                touch();
              }}
            />
            Allow comments
          </label>
        </div>
        {!date && <p className="admin-field__hint">Leave the date empty to use the time you publish.</p>}
      </div>

      <div className="editor__bar">
        <div className="editor__message" role="status">
          {message ? (
            <span className={message.kind === "error" ? "admin-error" : "admin-ok"}>{message.text}</span>
          ) : busy ? (
            <span className="admin-muted">Uploading…</span>
          ) : dirty ? (
            <span className="admin-muted">Unsaved changes</span>
          ) : null}
        </div>
        <button type="button" className="admin-btn admin-btn--danger-text" onClick={remove} disabled={saving}>
          {id ? "Delete" : "Discard"}
        </button>
        {status === "published" ? (
          <>
            <button type="button" className="admin-btn" onClick={() => save("unpublish")} disabled={saving || busy}>
              Unpublish
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => save("publish")} disabled={saving || busy || empty}>
              {saving ? "Saving…" : "Update"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="admin-btn" onClick={() => save("draft")} disabled={saving || busy || empty}>
              Save draft
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => save("publish")} disabled={saving || busy || empty}>
              {saving ? "Saving…" : "Publish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
