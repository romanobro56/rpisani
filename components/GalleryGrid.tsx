"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import type { GalleryItem } from "@/lib/queries";
import { MediaItem } from "./MediaCarousel";

type Item = GalleryItem & { caption: string; date: string };

/** Square grid of every photo and video; clicking one opens a full-screen viewer with arrow-key and swipe navigation. */
export function GalleryGrid({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="gallery">
        {items.map((m, i) => (
          <button
            type="button"
            key={`${m.postId}-${m.id}`}
            className="gallery__tile"
            onClick={() => setOpen(i)}
            aria-label={m.kind === "video" ? `Play video, ${formatDuration(m.durationSec)}` : m.alt || "Open photo"}
          >
            <img src={m.thumb} alt={m.alt} loading="lazy" decoding="async" />
            {m.kind === "video" && (
              <span className="gallery__badge">
                <i className="fas fa-play" aria-hidden="true"></i> {formatDuration(m.durationSec)}
              </span>
            )}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox items={items} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({
  items,
  index,
  onChange,
  onClose,
}: {
  items: Item[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const m = items[index];
  const dialog = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const prev = useCallback(() => index > 0 && onChange(index - 1), [index, onChange]);
  const next = useCallback(() => index < items.length - 1 && onChange(index + 1), [index, items.length, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={m.kind === "video" ? "Video" : "Photo"}
      tabIndex={-1}
      ref={dialog}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
      }}
    >
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close">
        <i className="fas fa-xmark" aria-hidden="true"></i>
      </button>
      {index > 0 && (
        <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={prev} aria-label="Previous">
          <i className="fas fa-chevron-left" aria-hidden="true"></i>
        </button>
      )}
      {index < items.length - 1 && (
        <button type="button" className="lightbox__nav lightbox__nav--next" onClick={next} aria-label="Next">
          <i className="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
      )}
      <figure className="lightbox__figure" key={m.id}>
        <MediaItem m={m} eager />
        <figcaption className="lightbox__caption">
          {m.caption && <span className="lightbox__text">{m.caption}</span>}
          <span className="lightbox__meta">
            {m.date} &middot; <a href={`/feed/${m.postId}/`}>View post</a> &middot; {index + 1} of {items.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
