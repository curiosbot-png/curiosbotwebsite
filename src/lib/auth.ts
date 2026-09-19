import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { one, query } from "./db";

export const SESSION_COOKIE = "cb_session";
const SESSION_HOURS = 12;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type Role = "admin" | "marketing";
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

/** Password policy: 12+ chars, mixed classes. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 12) return "Password must be at least 12 characters.";
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) return "Use upper case, lower case and a number.";
  return null;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** Fixed-window DB rate limiter. Returns true when the request is allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const rows = await query<{ hits: number }>(
    `INSERT INTO rate_limits(key, window_start, hits)
     VALUES ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), 1)
     ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limits.hits + 1
     RETURNING hits`,
    [key, windowSeconds],
  );
  return (rows[0]?.hits ?? 1) <= limit;
}

export async function audit(userId: string | null, action: string, entity?: string, entityId?: string, detail: object = {}) {
  await query("INSERT INTO audit_logs(user_id, action, entity, entity_id, detail, ip) VALUES ($1,$2,$3,$4,$5,$6)", [
    userId, action, entity ?? null, entityId ?? null, JSON.stringify(detail), await clientIp(),
  ]);
}

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const ip = await clientIp();
  const generic = "Invalid email or password.";
  if (!(await rateLimit(`login:ip:${ip}`, 20, 900)) || !(await rateLimit(`login:email:${email.toLowerCase()}`, 8, 900))) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }
  const user = await one<{ id: string; password_hash: string; disabled: boolean; locked_until: Date | null; failed_logins: number }>(
    "SELECT id, password_hash, disabled, locked_until, failed_logins FROM users WHERE email = $1", [email],
  );
  // Always run a hash comparison to keep timing similar for unknown users.
  const hash = user?.password_hash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi";
  const valid = await verifyPassword(password, hash).catch(() => false);
  if (!user || user.disabled) return { ok: false, error: generic };
  if (user.locked_until && user.locked_until > new Date()) return { ok: false, error: "Account temporarily locked. Try later." };
  if (!valid) {
    const failed = user.failed_logins + 1;
    await query("UPDATE users SET failed_logins=$2::int, locked_until = CASE WHEN $2::int >= $3::int THEN now() + ($4::text || ' minutes')::interval ELSE NULL END WHERE id=$1", [
      user.id, failed, MAX_FAILED, String(LOCK_MINUTES),
    ]);
    await audit(user.id, "login_failed");
    return { ok: false, error: generic };
  }
  await query("UPDATE users SET failed_logins=0, locked_until=NULL WHERE id=$1", [user.id]);
  const token = newToken();
  const h = await headers();
  await query("INSERT INTO sessions(user_id, token_hash, expires_at, ip, user_agent) VALUES ($1,$2, now() + ($3 || ' hours')::interval,$4,$5)", [
    user.id, sha256(token), String(SESSION_HOURS), ip, h.get("user-agent")?.slice(0, 250) ?? null,
  ]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_HOURS * 3600,
  });
  await audit(user.id, "login");
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash=$1", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return one<SessionUser>(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.disabled = false`, [sha256(token)],
  );
}

/** Use in server components/actions. Redirect paths are logical (/admin/...) — middleware maps them per host. */
export async function requireUser(roles: Role[] = ["admin", "marketing"]): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect("/admin/forbidden");
  return user;
}
