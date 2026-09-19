"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, hashPassword, login, logout, newToken, passwordProblem, rateLimit, sha256, clientIp } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { notifyN8n } from "@/lib/leads";
import { ah } from "@/lib/admin-nav";

export type FormState = { error?: string; ok?: string } | undefined;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const p = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!p.success) return { error: "Enter a valid email and password." };
  const r = await login(p.data.email, p.data.password);
  if (!r.ok) return { error: r.error };
  redirect(ah(""));
}

export async function logoutAction() { await logout(); redirect(ah("/login")); }

export async function requestResetAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const generic: FormState = { ok: "If that account exists, a reset link has been sent." };
  if (!z.string().email().safeParse(email).success) return generic;
  if (!(await rateLimit(`reset:${await clientIp()}`, 5, 3600))) return { error: "Too many requests. Try again later." };
  const user = await one<{ id: string }>("SELECT id FROM users WHERE email=$1 AND disabled=false", [email]);
  if (user) {
    const token = newToken();
    await query("INSERT INTO password_resets(user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '30 minutes')", [user.id, sha256(token)]);
    const base = process.env.ADMIN_URL || "http://localhost:3000/admin";
    // Email is sent by the n8n "password-reset" workflow (transactional email provider). Token is never logged.
    await notifyN8n("password-reset", { email, resetUrl: `${base.replace(/\/$/, "")}/reset?token=${token}` });
    await audit(user.id, "password_reset_requested");
  }
  return generic;
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? ""), pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("password2") ?? "");
  if (pw !== pw2) return { error: "Passwords do not match." };
  const problem = passwordProblem(pw);
  if (problem) return { error: problem };
  const row = await one<{ id: string; user_id: string }>("SELECT id, user_id FROM password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()", [sha256(token)]);
  if (!row) return { error: "This reset link is invalid or has expired." };
  await query("UPDATE users SET password_hash=$2, failed_logins=0, locked_until=NULL WHERE id=$1", [row.user_id, await hashPassword(pw)]);
  await query("UPDATE password_resets SET used_at=now() WHERE id=$1", [row.id]);
  await query("DELETE FROM sessions WHERE user_id=$1", [row.user_id]); // invalidate all sessions
  await audit(row.user_id, "password_reset_completed");
  redirect(ah("/login"));
}
