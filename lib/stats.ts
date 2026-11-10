import "server-only";
import { and, count, desc, eq, gte, isNotNull, sql, sum } from "drizzle-orm";
import { getDb } from "@/db";
import { blogPosts, comments, feedPosts, media, pageViews } from "@/db/schema";
import { site } from "./site";

const TZ = sql.raw(`'${site.timeZone}'`);
const DAYS = 30;

export type DailyPoint = { day: string; views: number; visitors: number };
export type Ranked = { label: string; views: number; visitors: number };

export type DashboardStats = {
  daily: DailyPoint[];
  totals: { today: number; week: number; month: number; allTime: number; visitorsMonth: number; visitorsToday: number };
  topPages: Ranked[];
  referrers: Ranked[];
  countries: Ranked[];
  devices: { mobile: number; desktop: number };
  content: {
    blogPublished: number;
    blogDrafts: number;
    feedPublished: number;
    feedDrafts: number;
    comments: number;
    pendingComments: number;
    hiddenComments: number;
    mediaCount: number;
    mediaBytes: number;
  };
};

/** YYYY-MM-DD for each of the last `n` days in the site's time zone, oldest first. */
function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86_400_000).toLocaleDateString("en-CA", { timeZone: site.timeZone }));
  }
  return out;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  // One day of slack so the oldest local day is fully covered whatever the server's zone.
  const since = new Date(Date.now() - (DAYS + 1) * 86_400_000);
  const day = sql<string>`to_char(${pageViews.createdAt} at time zone ${TZ}, 'YYYY-MM-DD')`;
  const visitors = sql<number>`count(distinct ${pageViews.visitorHash})`.mapWith(Number);
  // Visitor hashes rotate daily, so "visitors" over a range is the sum of daily uniques.
  const visitorDays = sql<number>`count(distinct (${pageViews.visitorHash}, ${day}))`.mapWith(Number);
  const recent = gte(pageViews.createdAt, since);

  const ranked = (column: typeof pageViews.path | typeof pageViews.referrer | typeof pageViews.country, limit: number) =>
    db
      .select({ label: column, views: count(), visitors: visitorDays })
      .from(pageViews)
      .where(and(recent, isNotNull(column)))
      .groupBy(column)
      .orderBy(desc(count()))
      .limit(limit);

  const [daily, allTime, topPages, referrers, countries, devices, blogCounts, feedCounts, commentCounts, mediaTotals] =
    await Promise.all([
      db.select({ day, views: count(), visitors }).from(pageViews).where(recent).groupBy(day),
      db.select({ n: count() }).from(pageViews),
      ranked(pageViews.path, 12),
      ranked(pageViews.referrer, 10),
      ranked(pageViews.country, 8),
      db.select({ device: pageViews.device, n: count() }).from(pageViews).where(recent).groupBy(pageViews.device),
      db.select({ status: blogPosts.status, n: count() }).from(blogPosts).groupBy(blogPosts.status),
      db.select({ status: feedPosts.status, n: count() }).from(feedPosts).groupBy(feedPosts.status),
      db.select({ status: comments.status, n: count() }).from(comments).groupBy(comments.status),
      db
        .select({ n: count(), bytes: sum(media.totalBytes).mapWith(Number) })
        .from(media)
        .where(eq(media.status, "ready")),
    ]);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = lastDays(DAYS).map((d) => ({ day: d, views: byDay.get(d)?.views ?? 0, visitors: byDay.get(d)?.visitors ?? 0 }));
  const sumLast = (n: number, k: "views" | "visitors") => series.slice(-n).reduce((a, p) => a + p[k], 0);
  const statusCount = (rows: { status: string; n: number }[], s: string) => rows.find((r) => r.status === s)?.n ?? 0;

  return {
    daily: series,
    totals: {
      today: sumLast(1, "views"),
      week: sumLast(7, "views"),
      month: sumLast(DAYS, "views"),
      allTime: allTime[0]?.n ?? 0,
      visitorsMonth: sumLast(DAYS, "visitors"),
      visitorsToday: sumLast(1, "visitors"),
    },
    topPages: topPages.map((r) => ({ label: r.label ?? "", views: r.views, visitors: r.visitors })),
    referrers: referrers.map((r) => ({ label: r.label ?? "", views: r.views, visitors: r.visitors })),
    countries: countries.map((r) => ({ label: r.label ?? "", views: r.views, visitors: r.visitors })),
    devices: {
      mobile: devices.find((d) => d.device === "mobile")?.n ?? 0,
      desktop: devices.find((d) => d.device === "desktop")?.n ?? 0,
    },
    content: {
      blogPublished: statusCount(blogCounts, "published"),
      blogDrafts: statusCount(blogCounts, "draft"),
      feedPublished: statusCount(feedCounts, "published"),
      feedDrafts: statusCount(feedCounts, "draft"),
      comments: statusCount(commentCounts, "visible"),
      pendingComments: statusCount(commentCounts, "pending"),
      hiddenComments: statusCount(commentCounts, "hidden"),
      mediaCount: mediaTotals[0]?.n ?? 0,
      mediaBytes: mediaTotals[0]?.bytes ?? 0,
    },
  };
}

/** Views per path over the last 30 days, for the post lists. */
export async function getViewsByPath(): Promise<Map<string, number>> {
  const db = await getDb();
  const rows = await db
    .select({ path: pageViews.path, n: count() })
    .from(pageViews)
    .where(gte(pageViews.createdAt, new Date(Date.now() - DAYS * 86_400_000)))
    .groupBy(pageViews.path);
  return new Map(rows.map((r) => [r.path, r.n]));
}
