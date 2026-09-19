"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CONSENT_EVENT, readConsent } from "./consent";

// First-party, consent-gated analytics. Random UUID only: no fingerprinting, no IP or user-agent collection client-side.
function visitorId(): string | null {
  try {
    let v = localStorage.getItem("cb_vid");
    if (!v) { v = crypto.randomUUID(); localStorage.setItem("cb_vid", v); }
    return v;
  } catch { return null; }
}

function attribution() {
  try {
    const stored = sessionStorage.getItem("cb_attr");
    if (stored) return JSON.parse(stored) as { source?: string; medium?: string; campaign?: string };
    const q = new URLSearchParams(location.search);
    let source = q.get("utm_source") ?? undefined;
    const medium = q.get("utm_medium") ?? undefined;
    const campaign = q.get("utm_campaign") ?? undefined;
    if (!source && document.referrer) {
      try { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (h && !h.endsWith("curiosbot.com")) source = h.split(".").slice(-2, -1)[0] ?? h; } catch {}
    }
    const a = { source, medium, campaign };
    sessionStorage.setItem("cb_attr", JSON.stringify(a));
    return a;
  } catch { return {}; }
}

function send(type: string, path: string, extra: { value?: number; meta?: Record<string, string> } = {}) {
  const consent = readConsent();
  if (!consent?.analytics) return;
  const vid = visitorId();
  if (!vid) return;
  const body = JSON.stringify({ vid, type, path, ...attribution(), ...extra, device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop" });
  fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

export function Tracker() {
  const pathname = usePathname();
  const maxScroll = useRef(0);
  const enabled = useRef(false);

  useEffect(() => {
    const sync = () => { enabled.current = Boolean(readConsent()?.analytics); };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    maxScroll.current = 0;
    const start = () => enabled.current && send("page_view", pathname);
    // Wait a tick so a just-given consent is honoured for the current page.
    const t0 = setTimeout(start, 50);
    let active = 0;
    const tick = setInterval(() => { if (document.visibilityState === "visible") active += 1; }, 1000);
    let flushed = false;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
      if (pct > maxScroll.current) maxScroll.current = pct;
    };
    // On leaving the page: report real active seconds ("engaged" needs 15s+) and max scroll depth once.
    const onHide = () => {
      if (flushed || !enabled.current) return;
      flushed = true;
      if (active >= 15) send("engaged", pathname, { value: active });
      if (maxScroll.current > 0) send("scroll", pathname, { value: Math.min(100, maxScroll.current) });
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cta]");
      if (el && enabled.current) send(el.dataset.cta === "download" ? "download" : "cta_click", pathname, { meta: { cta: el.dataset.cta ?? "" } });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const onVis = () => { if (document.visibilityState === "hidden") onHide(); };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(t0); clearInterval(tick); onHide();
      window.removeEventListener("scroll", onScroll); document.removeEventListener("click", onClick); document.removeEventListener("visibilitychange", onVis);
    };
  }, [pathname]);
  return null;
}
