"use server";

import { createHash } from "node:crypto";
import { count, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { pageViews } from "@/db/schema";
import { clientIp, isOwnDevice } from "@/lib/auth";
import { isSitePath } from "@/lib/format";
import { site } from "@/lib/site";

const BOT = /bot|crawl|spider|slurp|preview|monitor|headless|lighthouse|curl|wget|python|axios|node-fetch|go-http/i;
const VISITOR_VIEWS_PER_MINUTE = 30;
const SITE_VIEWS_PER_MINUTE = 600;

/**
 * Public Server Action called once per page view.
 * Visitors are counted with a hash of IP + user agent + the day, salted with the server secret, the
 * same approach Plausible uses. Raw IPs are never stored and the hash can't be linked across days.
 */
export async function trackView(path: string, referrer: string): Promise<void> {
  if (typeof path !== "string" || !isSitePath(path) || path.startsWith("/admin")) return;
  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return;
  if (await isOwnDevice()) return; // don't count your own visits, signed in or not

  // The site's local day, matching how the dashboard groups views, so one visitor is one hash per dashboard day.
  const day = new Date().toLocaleDateString("en-CA", { timeZone: site.timeZone });
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

  // This endpoint is public, so cap what one visitor, and everyone together, can write per minute.
  const db = await getDb();
  const [recent] = await db
    .select({
      all: count(),
      mine: sql<number>`count(*) filter (where ${pageViews.visitorHash} = ${visitorHash})`.mapWith(Number),
    })
    .from(pageViews)
    .where(gt(pageViews.createdAt, new Date(Date.now() - 60_000)));
  if (recent.mine >= VISITOR_VIEWS_PER_MINUTE || recent.all >= SITE_VIEWS_PER_MINUTE) return;

  await db.insert(pageViews).values({
    path,
    referrer: refHost,
    visitorHash,
    country: h.get("x-vercel-ip-country")?.slice(0, 2) ?? null,
    device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop",
  });
}
