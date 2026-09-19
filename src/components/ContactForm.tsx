"use client";
import Link from "next/link";
import { useState } from "react";

const SERVICES = ["AI Strategy & Adoption", "CXO AI Advisory", "AI Implementation & Automation", "PLM Consulting", "Salesforce Consulting", "Curiosbot AI Products", "Other"];

export function ContactForm({ kind = "contact", productInterest = "", serviceInterest = "", landing }: { kind?: "contact" | "demo" | "consultation"; productInterest?: string; serviceInterest?: string; landing?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    let attr: { source?: string; medium?: string; campaign?: string } = {};
    let vid: string | undefined;
    try { attr = JSON.parse(sessionStorage.getItem("cb_attr") ?? "{}"); vid = localStorage.getItem("cb_vid") ?? undefined; } catch {}
    const q = new URLSearchParams(location.search);
    const body = {
      name: f.get("name"), email: f.get("email"), company: f.get("company"), job_title: f.get("job_title"),
      industry: f.get("industry"), company_size: f.get("company_size"), country: f.get("country"),
      service_interest: f.get("service_interest"), product_interest: productInterest || f.get("product_interest") || "",
      message: f.get("message"), kind, privacy_ack: f.get("privacy_ack") === "on", marketing_opt_in: f.get("marketing_opt_in") === "on",
      landing_page: landing ?? location.pathname, vid, ...attr, term: q.get("utm_term") ?? undefined, content: q.get("utm_content") ?? undefined,
      website: f.get("website") ?? "",
    };
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setState("done"); return; }
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Something went wrong."); setState("error");
    } catch { setMsg("Network error. Please email us directly."); setState("error"); }
  }

  if (state === "done")
    return <div role="status" className="card"><h3 className="text-xl">Thank you — we&apos;ll be in touch shortly.</h3><p className="mt-2 text-slate-300">A member of the Curiosbot team will respond, usually within one business day.</p></div>;

  return (
    <form onSubmit={onSubmit} className="card space-y-4" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required autoComplete="name" />
        <Field label="Business email" name="email" type="email" required autoComplete="email" />
        <Field label="Company" name="company" autoComplete="organization" />
        <Field label="Job title" name="job_title" autoComplete="organization-title" />
        <Field label="Industry" name="industry" />
        <div>
          <label htmlFor="company_size" className="mb-1 block text-sm text-slate-300">Company size</label>
          <select id="company_size" name="company_size" className="field" defaultValue="">
            <option value="">Select…</option>{["1-50", "51-250", "251-1,000", "1,001-5,000", "5,000+"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Field label="Country" name="country" autoComplete="country-name" />
        <div>
          <label htmlFor="service_interest" className="mb-1 block text-sm text-slate-300">I&apos;m interested in</label>
          <select id="service_interest" name="service_interest" className="field" defaultValue={serviceInterest}>
            <option value="">Select…</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="mb-1 block text-sm text-slate-300">How can we help?</label>
        <textarea id="message" name="message" rows={4} maxLength={4000} className="field" />
      </div>
      {/* Honeypot: hidden from users and assistive tech */}
      <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" name="privacy_ack" required className="mt-1" />
        <span>I have read the <Link href="/privacy" className="text-brand-400 underline">privacy policy</Link> and agree that Curiosbot Digital S.L. may use my details to respond to this enquiry. *</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input type="checkbox" name="marketing_opt_in" className="mt-1" />
        <span>Optional: send me relevant insights and updates from Curiosbot. I can unsubscribe at any time.</span>
      </label>
      {state === "error" && <p role="alert" className="text-sm text-red-400">{msg}</p>}
      <button className="btn-primary" disabled={state === "sending"} data-cta="form-submit">{state === "sending" ? "Sending…" : kind === "demo" ? "Request a demo" : "Send message"}</button>
    </form>
  );
}

function Field({ label, name, type = "text", required, autoComplete }: { label: string; name: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm text-slate-300">{label}{required && " *"}</label>
      <input id={name} name={name} type={type} required={required} autoComplete={autoComplete} maxLength={200} className="field" />
    </div>
  );
}
