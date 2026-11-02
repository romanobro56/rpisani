import "server-only";
import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Every admin page and Server Action calls this; Server Actions are public endpoints otherwise. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login/");
}

export async function startSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * ADMIN_PASSWORD_HASH (from `npm run hash-password`) is preferred.
 * ADMIN_PASSWORD (plain text) is accepted for local development.
 */
export function checkPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (stored) {
    const [scheme, saltB64, hashB64] = stored.split(":");
    if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length);
    return timingSafeEqual(actual, expected);
  }
  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;
  const a = createHash("sha256").update(password).digest();
  const b = createHash("sha256").update(plain).digest();
  return timingSafeEqual(a, b);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD);
}

/** Client IP as reported by Vercel's edge (or the dev server). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

/** Salted, one-way hash so raw IPs are never stored. */
export function hashIp(ip: string, salt = ""): string {
  const secret = process.env.SESSION_SECRET ?? "dev";
  return createHash("sha256").update(`${secret}:${salt}:${ip}`).digest("base64url").slice(0, 32);
}
