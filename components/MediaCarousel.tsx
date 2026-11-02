"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaView } from "@/lib/queries";
import { formatDuration } from "@/lib/format";

/** Clamp the frame between 4:5 portrait and 16:9 landscape, like Instagram, so tall shots don't swamp the feed. */
function frameRatio(items: MediaView[]): number {
  const first = items[0];
  const r = first?.width && first?.height ? first.width / first.height : 1;
  return Math.min(16 / 9, Math.max(4 / 5, r));
}

export function MediaItem({ m, eager = false }: { m: MediaView; eager?: boolean }) {
  if (m.kind === "video") {
    return (
      <video
        className="media__video"
        src={m.src}
        poster={m.poster ?? undefined}
        controls
        playsInline
        preload="metadata"
        width={m.width ?? undefined}
        height={m.height ?? undefined}
        aria-label={m.alt || `Video, ${formatDuration(m.durationSec)}`}
      />
    );
  }
  return (
    <img
      className="media__img"
      src={m.src}
      alt={m.alt}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function MediaCarousel({ media, eager = false }: { media: MediaView[]; eager?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Keep the dots in sync with swipes and scroll-snapping.
  useEffect(() => {
    const el = track.current;
    if (!el || media.length < 2) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [media.length]);

  // Pause any video that scrolls out of view.
  useEffect(() => {
    track.current?.querySelectorAll("video").forEach((v, i) => {
      if (i !== index) v.pause();
    });
  }, [index]);

  if (!media.length) return null;

  if (media.length === 1) {
    const m = media[0];
    const ratio = m.width && m.height ? m.width / m.height : undefined;
    return (
      <div className="media media--single" style={ratio ? { aspectRatio: String(Math.max(ratio, 4 / 5)) } : undefined}>
        <MediaItem m={m} eager={eager} />
      </div>
    );
  }

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(media.length - 1, i));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="media media--carousel" style={{ aspectRatio: String(frameRatio(media)) }}>
      <div className="media__track" ref={track}>
        {media.map((m, i) => (
          <div className="media__slide" key={m.id} aria-label={`${i + 1} of ${media.length}`}>
            <MediaItem m={m} eager={eager && i === 0} />
          </div>
        ))}
      </div>
      {index > 0 && (
        <button type="button" className="media__nav media__nav--prev" onClick={() => go(index - 1)} aria-label="Previous">
          <i className="fas fa-chevron-left" aria-hidden="true"></i>
        </button>
      )}
      {index < media.length - 1 && (
        <button type="button" className="media__nav media__nav--next" onClick={() => go(index + 1)} aria-label="Next">
          <i className="fas fa-chevron-right" aria-hidden="true"></i>
        </button>
      )}
      <div className="media__count" aria-hidden="true">
        {index + 1}/{media.length}
      </div>
      <div className="media__dots" aria-hidden="true">
        {media.map((m, i) => (
          <span key={m.id} className={i === index ? "is-active" : undefined} />
        ))}
      </div>
    </div>
  );
}
