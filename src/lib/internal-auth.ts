import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison of an `Authorization: Bearer <secret>` header with the configured secret. */
export function bearerOk(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}
