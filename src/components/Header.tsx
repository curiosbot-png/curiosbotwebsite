"use client";
import Link from "next/link";
import { useState } from "react";
import { NAV } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/80 backdrop-blur-lg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-ink-900">Skip to content</a>
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" aria-label="Curiosbot home" className="font-display text-xl font-semibold text-white">
          curios<span className="gradient-text">bot</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <div key={n.href} className="group relative">
              <Link href={n.href} className="text-sm text-slate-300 transition hover:text-white">{n.label}</Link>
              {n.children && (
                <div className="invisible absolute left-0 top-full pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <div className="w-56 rounded-xl border border-white/10 bg-ink-800 p-2 shadow-2xl">
                    {n.children.map((c) => <Link key={c.href} href={c.href} className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">{c.label}</Link>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/contact" data-cta="header-contact" className="btn-primary hidden !px-5 !py-2 sm:inline-flex">Discuss your AI strategy</Link>
          <button className="rounded-lg p-2 text-white lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen(!open)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-ink-900 lg:hidden">
          <div className="container-x space-y-1 py-4">
            {NAV.flatMap((n) => [n, ...(n.children ?? [])]).map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-slate-200 hover:bg-white/5">{n.label}</Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">Discuss your AI strategy</Link>
          </div>
        </nav>
      )}
    </header>
  );
}
