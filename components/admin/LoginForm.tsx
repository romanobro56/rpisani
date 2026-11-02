"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="next" value={next} />
      <label className="admin-field">
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" autoFocus required />
      </label>
      {state.error && <p className="admin-error">{state.error}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
