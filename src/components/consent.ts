"use client";
// Consent state lives in a first-party cookie. Analytics and marketing are strictly opt-in (GDPR / ePrivacy).
export interface Consent { analytics: boolean; marketing: boolean; v: string; decided: boolean }
export const CONSENT_COOKIE = "cb_consent";
export const CONSENT_EVENT = "cb:consent";

export function readConsent(): Consent | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(CONSENT_COOKIE + "="));
    return m ? (JSON.parse(decodeURIComponent(m.split("=")[1])) as Consent) : null;
  } catch { return null; }
}

export function writeConsent(c: Omit<Consent, "decided">, policyVersion: string) {
  // Global Privacy Control is honoured: marketing consent is forced off.
  const gpc = (navigator as unknown as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  const value: Consent = { analytics: c.analytics, marketing: gpc ? false : c.marketing, v: policyVersion, decided: true };
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax; Secure`;
  if (!value.analytics) { try { localStorage.removeItem("cb_vid"); document.cookie = "cb_vid=; Max-Age=0; Path=/"; } catch {} }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  return value;
}
