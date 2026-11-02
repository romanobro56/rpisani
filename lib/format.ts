import { site } from "./site";

/** "October 7, 2026" */
export function formatLongDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: site.timeZone,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** "Oct 7, 2026" */
export function formatShortDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: site.timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** YYYY-MM-DD in the site's time zone, for <input type="date">. */
export function toDateInput(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: site.timeZone });
}

/** Noon in the site's time zone on the given YYYY-MM-DD, so the calendar date is stable everywhere. */
export function fromDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12);
  const zoned = new Date(new Date(noonUtc).toLocaleString("en-US", { timeZone: site.timeZone }));
  const utc = new Date(new Date(noonUtc).toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(noonUtc + (utc.getTime() - zoned.getTime()));
}

/** "4:05" or "1:02:09" */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

/** Reading time from markdown, ignoring embedded <style> blocks and tags. */
export function estimateReadTime(markdown: string): string {
  const text = markdown
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_>`[\]()!-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 230))} min read`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 80);
}

export function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}
