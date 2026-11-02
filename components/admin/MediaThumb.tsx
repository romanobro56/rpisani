import type { AdminMedia } from "@/lib/admin-media";
import { WaveformIcon } from "../WaveformIcon";

/** A media item's thumbnail; audio without cover art shows a waveform instead. */
export function MediaThumb({ m, className, alt = "" }: { m: AdminMedia; className: string; alt?: string }) {
  if (m.thumb) return <img src={m.thumb} alt={alt} className={className} loading="lazy" draggable={false} />;
  return (
    <span className={`${className} media-thumb--wave`}>
      <WaveformIcon />
    </span>
  );
}
