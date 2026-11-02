// Bar heights for a symmetric, hand-drawn-looking waveform.
const BARS = [6, 12, 20, 30, 18, 38, 26, 44, 30, 20, 36, 24, 14, 26, 16, 8];

/** Stand-in artwork for audio without a cover image. */
export function WaveformIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 48" aria-hidden="true" focusable="false">
      {BARS.map((h, i) => (
        <rect key={i} x={2.5 + i * 3.75} y={24 - h / 2} width="2.2" height={h} rx="1.1" fill="currentColor" />
      ))}
    </svg>
  );
}
