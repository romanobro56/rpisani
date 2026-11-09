import { desc } from "drizzle-orm";
import { ViewsChart } from "@/components/admin/ViewsChart";
import { getDb } from "@/db";
import { comments } from "@/db/schema";
import { formatBytes, formatShortDate, truncate } from "@/lib/format";
import { getDashboardStats, type Ranked } from "@/lib/stats";

export const metadata = { title: "Dashboard" };

const nf = new Intl.NumberFormat("en-US");

function RankTable({ title, rows, empty, format }: { title: string; rows: Ranked[]; empty: string; format?: (s: string) => React.ReactNode }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <div className="admin-card">
      <h3>{title}</h3>
      {rows.length ? (
        <table className="admin-table admin-table--rank">
          <thead>
            <tr>
              <th></th>
              <th className="num">Views</th>
              <th className="num" title="Daily unique visitors, added up over the 30 days">Visitor-days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>
                  <span className="rank-bar" style={{ width: `${(r.views / max) * 100}%` }} aria-hidden="true" />
                  <span className="rank-label">{format ? format(r.label) : r.label}</span>
                </td>
                <td className="num">{nf.format(r.views)}</td>
                <td className="num">{nf.format(r.visitors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="admin-muted">{empty}</p>
      )}
    </div>
  );
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const db = await getDb();
  const recentComments = await db.select().from(comments).orderBy(desc(comments.createdAt)).limit(5);
  const { totals, content, devices } = stats;
  const deviceTotal = devices.mobile + devices.desktop;

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard</h1>
        <div className="admin-actions">
          <a className="admin-btn admin-btn--primary" href="/admin/posts/new/">
            <i className="fas fa-plus" aria-hidden="true"></i> New post
          </a>
          <a className="admin-btn" href="/admin/blog/new/">
            <i className="fas fa-pen-nib" aria-hidden="true"></i> New blog post
          </a>
        </div>
      </div>

      <div className="stat-tiles">
        <div className="stat-tile">
          <span className="stat-tile__label">Views today</span>
          <span className="stat-tile__value">{nf.format(totals.today)}</span>
          <span className="stat-tile__sub">{nf.format(totals.visitorsToday)} {totals.visitorsToday === 1 ? "visitor" : "visitors"}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__label">Last 7 days</span>
          <span className="stat-tile__value">{nf.format(totals.week)}</span>
          <span className="stat-tile__sub">views</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__label">Last 30 days</span>
          <span className="stat-tile__value">{nf.format(totals.month)}</span>
          <span className="stat-tile__sub">{nf.format(totals.visitorsMonth)} visitor-days</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__label">All time</span>
          <span className="stat-tile__value">{nf.format(totals.allTime)}</span>
          <span className="stat-tile__sub">views</span>
        </div>
      </div>

      <div className="admin-card">
        <h3>Page views, last 30 days</h3>
        <ViewsChart data={stats.daily} />
        <p className="admin-muted admin-small">
          Visitors are counted per day without cookies, so someone who comes back on three days is three visitor-days:
          the 30-day figures are an upper bound on people, not a head count. Your own visits aren’t counted on any
          browser you’ve signed in on.
        </p>
      </div>

      <div className="admin-grid">
        <RankTable
          title="Top pages (30 days)"
          rows={stats.topPages}
          empty="No views yet."
          format={(p) => (
            <a href={p} target="_blank" rel="noopener">
              {p}
            </a>
          )}
        />
        <RankTable title="Referrers (30 days)" rows={stats.referrers} empty="No outside referrers yet." />
        <RankTable
          title="Countries (30 days)"
          rows={stats.countries}
          empty="Country data appears once the site is on Vercel."
          format={(c) => {
            try {
              return regionNames.of(c) ?? c;
            } catch {
              return c;
            }
          }}
        />
        <div className="admin-card">
          <h3>Devices (30 days)</h3>
          {deviceTotal ? (
            <table className="admin-table admin-table--rank">
              <tbody>
                {(["desktop", "mobile"] as const).map((d) => (
                  <tr key={d}>
                    <td>
                      <span className="rank-bar" style={{ width: `${(devices[d] / deviceTotal) * 100}%` }} aria-hidden="true" />
                      <span className="rank-label">{d === "desktop" ? "Desktop" : "Mobile"}</span>
                    </td>
                    <td className="num">{Math.round((devices[d] / deviceTotal) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-muted">No views yet.</p>
          )}
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>Content</h3>
          <table className="admin-table">
            <tbody>
              <tr>
                <td>
                  <a href="/admin/posts/">Feed posts</a>
                </td>
                <td className="num">{content.feedPublished} published</td>
                <td className="num">{content.feedDrafts} drafts</td>
              </tr>
              <tr>
                <td>
                  <a href="/admin/blog/">Blog posts</a>
                </td>
                <td className="num">{content.blogPublished} published</td>
                <td className="num">{content.blogDrafts} drafts</td>
              </tr>
              <tr>
                <td>
                  <a href="/admin/comments/">Comments</a>
                </td>
                <td className="num">{content.comments} visible</td>
                <td className="num">{content.hiddenComments} hidden</td>
              </tr>
              <tr>
                <td>
                  <a href="/admin/media/">Media</a>
                </td>
                <td className="num">{content.mediaCount} files</td>
                <td className="num">{formatBytes(content.mediaBytes)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="admin-card">
          <h3>Recent comments</h3>
          {recentComments.length ? (
            <ul className="admin-list">
              {recentComments.map((c) => (
                <li key={c.id}>
                  <strong>{c.authorName}</strong> <span className="admin-muted">{formatShortDate(c.createdAt)}</span>
                  {c.status === "hidden" && <span className="badge-status badge-status--draft">Hidden</span>}
                  <div>{truncate(c.body, 120)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-muted">No comments yet.</p>
          )}
          <p className="admin-small">
            <a href="/admin/comments/">Manage comments →</a>
          </p>
        </div>
      </div>
    </>
  );
}
