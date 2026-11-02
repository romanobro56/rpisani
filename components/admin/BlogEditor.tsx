"use client";

import { useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useMemo, useRef, useState, useTransition } from "react";
import { deleteBlogPost, saveBlogPost } from "@/app/actions/admin";
import type { AdminMedia } from "@/lib/admin-media";
import { estimateReadTime, slugify } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { ACCEPT } from "@/lib/upload-client";
import { useUnsavedGuard } from "./useUnsavedGuard";
import { useUploads } from "./useUploads";

type Initial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  readTime: string;
  date: string;
  allowComments: boolean;
  status: "draft" | "published";
};

// Mirrors the structure of the existing posts: a back link, then the title as the ## heading.
const starter = (title: string) => `[← Back to Home](/)

## ${title || "Post Title"}

Opening paragraph.
`;

// Footnote markers in order of appearance, as in the old post template.
const NOTE_SYMBOLS = ["&#42;", "&dagger;", "&Dagger;", "&sect;", "&#8214;", "&para;"];

type View = "write" | "split" | "preview";

export function BlogEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? starter(""));
  const [readTime, setReadTime] = useState(initial?.readTime ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [allowComments, setAllowComments] = useState(initial?.allowComments ?? true);
  const [view, setView] = useState<View>("split");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const deferredBody = useDeferredValue(body);
  const previewHtml = useMemo(() => renderMarkdown(deferredBody), [deferredBody]);

  const touch = () => {
    setDirty(true);
    setMessage(null);
  };

  /** Replaces the selection (or inserts at the cursor) and keeps focus in the editor. */
  const insert = useCallback((before: string, after = "", placeholder = "") => {
    const el = textarea.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const selected = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    setBody(next);
    touch();
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + selected.length);
    });
  }, []);

  const insertBlock = useCallback((block: string) => {
    const el = textarea.current;
    if (!el) return;
    const pos = el.selectionEnd;
    const value = el.value;
    const pad = value.slice(0, pos).endsWith("\n\n") || pos === 0 ? "" : value.slice(0, pos).endsWith("\n") ? "\n" : "\n\n";
    const next = `${value.slice(0, pos)}${pad}${block}\n\n${value.slice(pos)}`;
    setBody(next);
    touch();
    requestAnimationFrame(() => {
      el.focus();
      const at = pos + pad.length + block.length + 2;
      el.setSelectionRange(at, at);
    });
  }, []);

  const { uploads, add, dismiss, busy } = useUploads((m: AdminMedia) => {
    if (m.kind === "video") {
      insertBlock(
        `<video controls playsinline preload="metadata" width="${m.width ?? ""}" height="${m.height ?? ""}" poster="${m.poster ?? ""}" src="${m.src}" style="width:100%;height:auto"></video>`,
      );
    } else if (m.kind === "audio") {
      insertBlock(`<audio controls preload="metadata" src="${m.src}" style="width:100%"></audio>`);
    } else {
      insertBlock(`![${m.alt || "Describe the image"}](${m.src})`);
    }
  });

  const addFootnote = () => {
    const n = (body.match(/id="ref-\d+"/g)?.length ?? 0) + 1;
    const symbol = NOTE_SYMBOLS[(n - 1) % NOTE_SYMBOLS.length];
    const marker = `<sup class="note-ref"><a href="#note-${n}" id="ref-${n}" aria-label="Note ${n}">${symbol}</a></sup>`;
    const note = `<sup class="note-ref"><a href="#ref-${n}" aria-label="Back to text">${symbol}</a></sup> Note text.\n{: .side-note #note-${n}}`;
    const el = textarea.current;
    const pos = el?.selectionEnd ?? body.length;
    let next = body.slice(0, pos) + marker + body.slice(pos);
    if (!next.includes('<hr class="notes-rule">')) next = `${next.trimEnd()}\n\n<hr class="notes-rule">`;
    next = `${next.trimEnd()}\n\n${note}\n`;
    setBody(next);
    touch();
  };

  const onTitle = (value: string) => {
    // Keep the body's heading in step while it still matches the old title.
    const oldHeading = `## ${title || "Post Title"}`;
    if (body.includes(`\n${oldHeading}\n`)) setBody(body.replace(`\n${oldHeading}\n`, `\n## ${value || "Post Title"}\n`));
    setTitle(value);
    if (!slugEdited) setSlug(slugify(value));
    touch();
  };

  const save = useCallback(
    (intent: "draft" | "publish" | "unpublish") => {
      if (busy) {
        setMessage({ kind: "error", text: "Wait for uploads to finish before saving." });
        return;
      }
      startSaving(async () => {
        const res = await saveBlogPost({
          id,
          title,
          slug,
          excerpt,
          body,
          readTime,
          date: date || null,
          allowComments,
          intent,
        });
        if (!res.ok) {
          setMessage({ kind: "error", text: res.error });
          return;
        }
        setStatus(res.status);
        if (res.slug) setSlug(res.slug);
        setDirty(false);
        setMessage({
          kind: "ok",
          text: intent === "publish" ? "Published." : intent === "unpublish" ? "Moved back to drafts." : "Saved.",
        });
        if (!id) {
          setId(res.id);
          router.replace(`/admin/blog/${res.id}/`);
        } else {
          router.refresh();
        }
      });
    },
    [busy, id, title, slug, excerpt, body, readTime, date, allowComments, router],
  );

  useUnsavedGuard(dirty || busy, () => save(status === "published" ? "publish" : "draft"));

  const remove = () => {
    if (!id) return router.push("/admin/blog/");
    if (!confirm(`Delete “${title}”? This also deletes its comments.`)) return;
    startSaving(async () => {
      await deleteBlogPost(id);
      setDirty(false);
      router.push("/admin/blog/");
    });
  };

  return (
    <div className="editor editor--blog">
      <div className="admin-head">
        <h1>{id ? "Edit blog post" : "New blog post"}</h1>
        <div className="admin-actions">
          <span className={`badge-status badge-status--${status}`}>{status === "draft" ? "Draft" : "Published"}</span>
          {id && (
            <a className="admin-btn" href={`/posts/${slug}/`} target="_blank" rel="noopener">
              {status === "published" ? "View" : "Preview"} <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
            </a>
          )}
        </div>
      </div>

      <div className="admin-card editor__meta">
        <label className="admin-field">
          <span>Title</span>
          <input value={title} onChange={(e) => onTitle(e.target.value)} placeholder="Post title" maxLength={200} />
        </label>
        <label className="admin-field">
          <span>URL</span>
          <div className="admin-input-prefix">
            <span>/posts/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
                touch();
              }}
              onBlur={() => setSlug(slugify(slug))}
              placeholder="post-title"
            />
            <span>/</span>
          </div>
        </label>
        <label className="admin-field admin-field--wide">
          <span>Excerpt</span>
          <input
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              touch();
            }}
            placeholder="One or two sentences for the post card."
            maxLength={500}
          />
        </label>
        <label className="admin-field">
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
        <label className="admin-field">
          <span>Read time</span>
          <input
            value={readTime}
            onChange={(e) => {
              setReadTime(e.target.value);
              touch();
            }}
            placeholder={`${estimateReadTime(body)} (auto)`}
            maxLength={40}
          />
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

      <div className="md-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => insert("**", "**", "bold")} title="Bold (wraps the selection)">
          <i className="fas fa-bold" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => insert("*", "*", "italic")} title="Italic">
          <i className="fas fa-italic" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => insert("\n### ", "\n", "Section heading")} title="Section heading">
          <i className="fas fa-heading" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => insert("[", "](https://)", "link text")} title="Link">
          <i className="fas fa-link" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => insert("\n> ", "\n", "Quote")} title="Quote">
          <i className="fas fa-quote-left" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => insert("\n- ", "\n", "List item")} title="Bulleted list">
          <i className="fas fa-list-ul" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={addFootnote} title="Footnote: marker at the cursor, note at the end">
          <i className="fas fa-asterisk" aria-hidden="true"></i>
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} title="Upload a photo or video at the cursor">
          <i className="fas fa-image" aria-hidden="true"></i> Upload
        </button>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="md-toolbar__views" role="group" aria-label="Editor layout">
          {(["write", "split", "preview"] as View[]).map((v) => (
            <button key={v} type="button" className={view === v ? "is-active" : undefined} onClick={() => setView(v)} aria-pressed={view === v}>
              {v === "write" ? "Write" : v === "split" ? "Split" : "Preview"}
            </button>
          ))}
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="md-uploads">
          {uploads.map((u) => (
            <li key={u.key}>
              {u.file.name}: {u.error ?? `${u.label} ${Math.round(u.progress * 100)}%`}
              {u.error && (
                <button type="button" className="admin-link-button" onClick={() => dismiss(u.key)}>
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={`md-panes md-panes--${view}`}>
        {view !== "preview" && (
          <textarea
            ref={textarea}
            className="md-source"
            value={body}
            spellCheck
            onChange={(e) => {
              setBody(e.target.value);
              touch();
            }}
            onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
            onDrop={(e) => {
              if (!e.dataTransfer.files.length) return;
              e.preventDefault();
              add(e.dataTransfer.files);
            }}
            aria-label="Markdown"
          />
        )}
        {view !== "write" && (
          // Same markup and CSS as the public post page, so this is what readers will see.
          <section className="admin-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>
      <p className="admin-field__hint">
        Markdown with HTML allowed. Kramdown-style attributes work too, e.g. <code>{"{: .side-note}"}</code> on the line after a
        paragraph. Press ⌘S to save.
      </p>

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
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => save("publish")} disabled={saving || busy}>
              {saving ? "Saving…" : "Update"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="admin-btn" onClick={() => save("draft")} disabled={saving || busy}>
              Save draft
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => save("publish")} disabled={saving || busy}>
              {saving ? "Saving…" : "Publish"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
