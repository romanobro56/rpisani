"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { pageViews } from "@/db/schema";
import { clientIp, isAdmin } from "@/lib/auth";

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http/i;

/**
 * Public Server Action called once per page view.
 * Visitors are counted with a hash of IP + user agent + the day, salted with the server secret, the
 * same approach Plausible uses. Raw IPs are never stored and the hash can't be linked across days.
 */
export async function trackView(path: string, referrer: string): Promise<void> {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("/admin")) return;
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return;
  if (await isAdmin()) return; // don't count your own visits

  const day = new Date().toISOString().slice(0, 10);
  const secret = process.env.SESSION_SECRET ?? "dev";
  const visitorHash = createHash("sha256")
    .update(`${secret}:${day}:${await clientIp()}:${ua}`)
    .digest("base64url")
    .slice(0, 24);

  let refHost: string | null = null;
  try {
    if (referrer) {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      const own = (h.get("host") ?? "").split(":")[0].replace(/^www\./, "");
      if (host && host !== own) refHost = host.slice(0, 120);
    }
  } catch {
    // ignore malformed referrers
  }

  const db = await getDb();
  await db.insert(pageViews).values({
    path: path.slice(0, 300),
    referrer: refHost,
    visitorHash,
    country: h.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
    device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop",
  });
}
