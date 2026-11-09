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

// Marks a browser the owner has signed in on. It outlives the session (and sign-out) so the owner's
// visits stay out of the analytics. Unsigned on purpose: forging it only opts that browser out of the stats.
const OWN_DEVICE_COOKIE = "own_device";
const OWN_DEVICE_DAYS = 400; // the longest lifetime browsers allow

export async function startSession(): Promise<void> {
  const jar = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  } as const;
  jar.set(SESSION_COOKIE, await signSession(), { ...base, maxAge: SESSION_DAYS * 24 * 60 * 60 });
  jar.set(OWN_DEVICE_COOKIE, "1", { ...base, maxAge: OWN_DEVICE_DAYS * 24 * 60 * 60 });
}

/** True for the signed-in owner and for any browser the owner has signed in on before. */
export async function isOwnDevice(): Promise<boolean> {
  const jar = await cookies();
  return jar.has(OWN_DEVICE_COOKIE) || verifySession(jar.get(SESSION_COOKIE)?.value);
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
