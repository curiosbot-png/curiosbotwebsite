import Link from "next/link";
import { SITE } from "@/lib/site";
import { CookieSettingsButton } from "./CookieSettingsButton";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-900">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-xl font-semibold text-white">curios<span className="gradient-text">bot</span></p>
          <p className="mt-3 text-sm text-slate-400">AI strategy, PLM and Salesforce transformation — from advice to production systems and measurable value.</p>
        </div>
        <FooterCol title="Practices" links={[["/ai-consulting", "AI Consulting"], ["/ai-strategy-adoption", "AI Strategy & Adoption"], ["/cxo-ai-advisory", "CXO AI Advisory"], ["/plm-consulting", "PLM Consulting"], ["/salesforce-consulting", "Salesforce Consulting"]]} />
        <FooterCol title="Company" links={[["/products", "AI Products"], ["/insights", "Insights"], ["/about", "About"], ["/contact", "Contact"]]} />
        <div>
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <address className="mt-3 space-y-1 text-sm not-italic text-slate-400">
            <p>{SITE.address}</p>
            <p><a className="hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
            <p><a className="hover:text-white" href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`}>{SITE.phone}</a></p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/cookie-policy" className="hover:text-white">Cookie policy</Link>
            <Link href="/legal-notice" className="hover:text-white">Legal notice</Link>
            <CookieSettingsButton />
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-400">{links.map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white">{l}</Link></li>)}</ul>
    </div>
  );
}
