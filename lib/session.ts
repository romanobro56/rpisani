import { jwtVerify, SignJWT } from "jose";

// Shared by proxy.ts and server code, so it must stay free of Node-only and database imports.

export const SESSION_COOKIE = "admin_session";
export const SESSION_DAYS = 30;

const DEV_SECRET = "dev-only-session-secret-change-me-0123456789";

function secretKey(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : DEV_SECRET);
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function signSession(): Promise<string> {
  const key = secretKey();
  if (!key) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  const key = secretKey();
  if (!token || !key) return false;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
