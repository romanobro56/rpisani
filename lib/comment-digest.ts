import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { blogPosts, comments, feedPosts, kv } from "@/db/schema";
import { truncate } from "./format";
import { site } from "./site";

/**
 * Emails the owner about new comments, batched so a burst is one email.
 *
 * Serverless functions can't hold a timer, so the wait is done by the email provider: each new
 * comment cancels the email that was scheduled and schedules a fresh one, listing every comment
 * since the last send, DEBOUNCE_MINUTES from now. The timer therefore restarts with each comment.
 * Once FLUSH_AT comments are waiting the email goes immediately instead.
 *
 * Needs RESEND_API_KEY and a recipient (COMMENT_EMAIL_TO, else BIKE_EMAIL_TO). Without them it does nothing.
 */
export const DEBOUNCE_MINUTES = 10;
export const FLUSH_AT = 10;

const STATE_KEY = "comment_digest";
const API = "https://api.resend.com/emails";

/** The email currently scheduled (emailId is null if scheduling failed) and the comments it lists. */
type DigestState = { emailId: string | null; sendAt: string; ids: string[] };

type DigestComment = {
  authorName: string;
  body: string;
  status: "visible" | "hidden" | "pending";
  postLabel: string;
  postUrl: string;
};

function settings() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.COMMENT_EMAIL_TO || process.env.BIKE_EMAIL_TO;
  if (!apiKey || !to) return null;
  const from = process.env.COMMENT_EMAIL_FROM || process.env.BIKE_EMAIL_FROM || "Site comments <onboarding@resend.dev>";
  return { apiKey, to, from };
}

async function resend(apiKey: string, url: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
}

/** False only when the provider refuses, which means the email has already gone out. */
async function cancelScheduled(apiKey: string, emailId: string): Promise<boolean> {
  try {
    const res = await resend(apiKey, `${API}/${encodeURIComponent(emailId)}/cancel`);
    return res.ok || res.status >= 500;
  } catch {
    // Unreachable: keep the comments in the batch. A repeat in the inbox beats a missed comment.
    return true;
  }
}

export function composeDigest(batch: DigestComment[]): { subject: string; text: string } {
  const host = new URL(site.url).host;
  const pending = batch.filter((c) => c.status === "pending").length;
  const count = `${batch.length} new ${batch.length === 1 ? "comment" : "comments"}`;
  const subject = `${count} on ${host}${pending ? ` (${pending} awaiting approval)` : ""}`;
  const entries = batch.map((c) => {
    const state = c.status === "pending" ? "awaiting approval" : c.status === "visible" ? "live" : "hidden";
    return [`${truncate(c.authorName, 60)} on "${c.postLabel}" (${state})`, truncate(c.body, 600), c.postUrl].join("\n");
  });
  const text = [`${count} on ${host}.`, ...entries, `Approve, hide or block: ${site.url}/admin/comments/?status=pending`].join("\n\n");
  return { subject, text };
}

/** Called after a comment is saved. Never throws for provider failures; the batch is kept and retried with the next comment. */
export async function queueCommentEmail(commentId: string): Promise<void> {
  const config = settings();
  if (!config) return;
  const db = await getDb();

  await db.transaction(async (tx) => {
    // One at a time, so two comments landing together can't each schedule an email.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${STATE_KEY}))`);
    const [stored] = await tx.select().from(kv).where(eq(kv.key, STATE_KEY));
    const state = (stored?.value ?? null) as DigestState | null;

    // Carry over the comments from a scheduled email that hasn't gone out yet (or never got scheduled).
    let ids: string[] = [];
    if (state) {
      const waiting = !state.emailId || new Date(state.sendAt).getTime() > Date.now();
      if (waiting && (!state.emailId || (await cancelScheduled(config.apiKey, state.emailId)))) ids = state.ids;
    }
    ids = [...new Set([...ids, commentId])];

    const rows = await tx.select().from(comments).where(inArray(comments.id, ids)).orderBy(comments.createdAt);
    if (!rows.length) {
      await tx.delete(kv).where(eq(kv.key, STATE_KEY));
      return;
    }
    const feedIds = rows.filter((c) => c.targetType === "feed").map((c) => c.targetId);
    const blogIds = rows.filter((c) => c.targetType === "blog").map((c) => c.targetId);
    const [feed, blog] = await Promise.all([
      feedIds.length ? tx.select().from(feedPosts).where(inArray(feedPosts.id, feedIds)) : [],
      blogIds.length ? tx.select().from(blogPosts).where(inArray(blogPosts.id, blogIds)) : [],
    ]);
    const batch = rows.map((c): DigestComment => {
      const base = { authorName: c.authorName, body: c.body, status: c.status };
      if (c.targetType === "feed") {
        const p = feed.find((f) => f.id === c.targetId);
        return { ...base, postLabel: p?.title || (p?.body.trim() ? truncate(p.body, 50) : "Feed post"), postUrl: `${site.url}/feed/${c.targetId}/` };
      }
      const p = blog.find((b) => b.id === c.targetId);
      return { ...base, postLabel: p?.title ?? "Blog post", postUrl: p ? `${site.url}/posts/${p.slug}/` : `${site.url}/blog/` };
    });

    const sendNow = batch.length >= FLUSH_AT;
    const sendAt = new Date(Date.now() + (sendNow ? 0 : DEBOUNCE_MINUTES * 60_000));
    let emailId: string | null = null;
    try {
      const res = await resend(config.apiKey, API, {
        from: config.from,
        to: [config.to],
        ...composeDigest(batch),
        ...(sendNow ? {} : { scheduled_at: sendAt.toISOString() }),
      });
      if (res.ok) emailId = ((await res.json()) as { id?: string }).id ?? null;
      else console.error(`Comment email was refused (HTTP ${res.status}).`);
    } catch {
      console.error("Comment email could not be sent; it will be retried with the next comment.");
    }

    if (sendNow && emailId) {
      await tx.delete(kv).where(eq(kv.key, STATE_KEY));
      return;
    }
    const next: DigestState = { emailId, sendAt: sendAt.toISOString(), ids: rows.map((c) => c.id) };
    await tx.insert(kv).values({ key: STATE_KEY, value: next }).onConflictDoUpdate({ target: kv.key, set: { value: next } });
  });
}
