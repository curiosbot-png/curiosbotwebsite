"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, writeConsent, type Consent } from "./consent";

export function CookieBanner({ policyVersion }: { policyVersion: string }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const c: Consent | null = readConsent();
    if (!c?.decided || c.v !== policyVersion) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("cb:open-consent", reopen);
    return () => window.removeEventListener("cb:open-consent", reopen);
  }, [policyVersion]);

  if (!open) return null;
  const save = (a: boolean, m: boolean) => { writeConsent({ analytics: a, marketing: m, v: policyVersion }, policyVersion); setOpen(false); };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cb-consent-title" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-white/15 bg-ink-800/95 p-5 shadow-2xl backdrop-blur">
      <h2 id="cb-consent-title" className="text-base font-semibold text-white">Your privacy choices</h2>
      <p className="mt-2 text-sm text-slate-300">
        We use strictly necessary cookies to run the site. With your permission we also use first-party analytics to understand which content is useful, and marketing cookies to attribute campaigns. Nothing optional is enabled until you choose.{" "}
        <Link href="/cookie-policy" className="text-brand-400 underline">Cookie policy</Link>
      </p>
      {custom && (
        <div className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-3"><input type="checkbox" checked disabled className="mt-1" /><span><b className="text-white">Necessary</b> — always on.</span></label>
          <label className="flex items-start gap-3"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1" /><span><b className="text-white">Analytics</b> — anonymous first-party page and engagement measurement.</span></label>
          <label className="flex items-start gap-3"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" /><span><b className="text-white">Marketing</b> — campaign attribution and linking your visits to an enquiry you submit.</span></label>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => save(true, true)}>Accept all</button>
        <button className="btn-ghost" onClick={() => save(false, false)}>Reject optional</button>
        {custom ? <button className="btn-ghost" onClick={() => save(analytics, marketing)}>Save choices</button> : <button className="btn-ghost" onClick={() => setCustom(true)}>Customise</button>}
      </div>
    </div>
  );
}
