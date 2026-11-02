"use server";

import { and, count, eq, gt, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { loginAttempts } from "@/db/schema";
import { checkPassword, clientIp, endSession, hashIp, isAdminConfigured, startSession } from "@/lib/auth";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) return { error: "Admin login isn't configured. Set ADMIN_PASSWORD_HASH." };

  const db = await getDb();
  const ipHash = hashIp(await clientIp(), "login");
  const since = new Date(Date.now() - WINDOW_MS);
  const [{ n }] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ipHash, ipHash), gt(loginAttempts.createdAt, since)));
  if (n >= MAX_FAILURES) return { error: "Too many attempts. Try again in 15 minutes." };

  const password = String(form.get("password") ?? "");
  if (!password || !checkPassword(password)) {
    await db.insert(loginAttempts).values({ ipHash });
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
    return { error: "Wrong password." };
  }

  await db.delete(loginAttempts).where(eq(loginAttempts.ipHash, ipHash));
  await startSession();
  const next = String(form.get("next") ?? "");
  // Only same-site admin paths, never an open redirect.
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin/");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login/");
}
