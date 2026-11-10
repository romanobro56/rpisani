import "server-only";
import { and, eq, or } from "drizzle-orm";
import { cookies } from "next/headers";
import type { Db } from "@/db";
import { commentBlocks, comments } from "@/db/schema";
import { newId } from "./ids";

/**
 * New comments wait for approval. Commenters aren't told: their own comments are shown back to
 * them (matched by the cookie below), so a troll sees their comment "posted" while nobody else does.
 * Once a commenter has an approved comment, their later ones go live straight away.
 */

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type NewCommentStatus = "visible" | "hidden" | "pending";

const COMMENTER_COOKIE = "commenter";
const COMMENTER_DAYS = 400; // the longest lifetime browsers allow
const ID_FORMAT = /^[A-Za-z0-9]{24}$/;

/** The commenter id from this browser's cookie, if it has commented before. */
export async function readCommenterId(): Promise<string | null> {
  const value = (await cookies()).get(COMMENTER_COOKIE)?.value;
  return value && ID_FORMAT.test(value) ? value : null;
}

/** Reads the commenter id, creating it on a first comment. Only callable from a Server Action. */
export async function ensureCommenterId(): Promise<string> {
  const id = (await readCommenterId()) ?? newId(24);
  (await cookies()).set(COMMENTER_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COMMENTER_DAYS * 24 * 60 * 60,
  });
  return id;
}

/**
 * Decides how a new comment is stored: hidden for a blocked commenter, visible for one who has
 * been approved before, otherwise pending.
 */
export async function statusForNewComment(tx: Tx, ipHash: string, visitorId: string): Promise<NewCommentStatus> {
  const blocks = await tx
    .select()
    .from(commentBlocks)
    .where(or(eq(commentBlocks.ipHash, ipHash), eq(commentBlocks.visitorId, visitorId)));
  if (blocks.length) {
    // Remember whichever of the two this block hadn't seen, so changing network and clearing
    // cookies one after the other doesn't get around it.
    const { label } = blocks[0];
    const originId = blocks[0].originId ?? blocks[0].id;
    if (!blocks.some((b) => b.ipHash === ipHash)) await tx.insert(commentBlocks).values({ ipHash, label, originId });
    if (!blocks.some((b) => b.visitorId === visitorId)) await tx.insert(commentBlocks).values({ visitorId, label, originId });
    return "hidden";
  }

  const [approved] = await tx
    .select({ id: comments.id })
    .from(comments)
    .where(and(eq(comments.visitorId, visitorId), eq(comments.status, "visible")))
    .limit(1);
  return approved ? "visible" : "pending";
}
