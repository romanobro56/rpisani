"use client";

import { useState } from "react";
import type { DailyPoint } from "@/lib/stats";

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 24, left: 36 };

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / pow) * pow;
}

function label(day: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

/** Daily page views as bars; hover or focus a day for views and visitors. Single series, so no legend. */
export function ViewsChart({ data }: { data: DailyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.views), 0));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, slot - 2); // 2px surface gap between bars
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="views-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Page views per day for the last 30 days" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="views-chart__grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="views-chart__axis" x={PAD.left - 6} y={y(t) + 4} textAnchor="end">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + 1;
          const h = Math.max(0, y(0) - y(d.views));
          const r = Math.min(4, barW / 2, h);
          // Rounded top, square base anchored to the baseline.
          const path = h
            ? `M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`
            : "";
          return (
            <g key={d.day}>
              {path && <path className={`views-chart__bar${hover === i ? " is-hover" : ""}`} d={path} />}
              {/* Hit target spans the full column height, larger than the bar. */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${label(d.day, { month: "short", day: "numeric" })}: ${d.views} views, ${d.visitors} visitors`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          );
        })}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
          <text
            key={i}
            className="views-chart__axis"
            x={PAD.left + i * slot + slot / 2}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          >
            {label(data[i].day, { month: "short", day: "numeric" })}
          </text>
        ))}
      </svg>
      {active && hover !== null && (
        <div
          className="views-chart__tip"
          style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }}
          role="status"
        >
          <strong>{label(active.day, { weekday: "short", month: "short", day: "numeric" })}</strong>
          <span>
            {active.views} {active.views === 1 ? "view" : "views"}
          </span>
          <span>
            {active.visitors} {active.visitors === 1 ? "visitor" : "visitors"}
          </span>
        </div>
      )}
    </div>
  );
}
