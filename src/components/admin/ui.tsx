import Link from "next/link";
import type { ReactNode } from "react";
import { ah } from "@/lib/admin-nav";

export const fmt = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? "—" : n.toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d }));
export const fmtPct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toFixed(1)}%`);
export const fmtEur = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("en-GB", { style: "currency", currency: "EUR" }));

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-semibold">{title}</h1>{sub && <p className="mt-1 max-w-3xl text-sm text-slate-400">{sub}</p>}</div>{actions}
    </div>
  );
}

export function Panel({ title, children, className = "", note }: { title?: string; children: ReactNode; className?: string; note?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      {title && <div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="text-base font-semibold text-white">{title}</h2>{note && <span className="text-xs text-slate-500">{note}</span>}</div>}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">{children}</p>;
}

/** Percentage change badge vs the previous comparable period. null = no prior data to compare. */
export function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-500">no prior data</span>;
  const up = value > 0, flat = Math.abs(value) < 0.05;
  return <span className={`text-xs font-medium ${flat ? "text-slate-400" : up ? "text-emerald-400" : "text-rose-400"}`}>{flat ? "0.0%" : `${up ? "▲" : "▼"} ${Math.abs(value).toFixed(1)}%`} <span className="text-slate-500">vs prev.</span></span>;
}

export function Kpi({ label, value, change, hint }: { label: string; value: string; change: number | null; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" title={hint}>
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      <div className="mt-1"><Delta value={change} /></div>
    </div>
  );
}

const PERIODS = [["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["year", "Year"]] as const;
export function PeriodPicker({ base, period, extra = {}, from, to }: { base: string; period: string; extra?: Record<string, string | undefined>; from?: string; to?: string }) {
  const qs = (p: Record<string, string | undefined>) => { const s = new URLSearchParams(); Object.entries({ ...extra, ...p }).forEach(([k, v]) => v && s.set(k, v)); return `${ah(base)}?${s}`; };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Period">
      {PERIODS.map(([k, l]) => <Link key={k} href={qs({ p: k })} aria-current={period === k} className={`rounded-full border px-3 py-1 ${period === k ? "border-transparent bg-brand-gradient text-white" : "border-white/15 text-slate-300 hover:border-white/40"}`}>{l}</Link>)}
      <form action={ah(base)} className="flex items-center gap-1">
        {Object.entries(extra).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
        <input type="hidden" name="p" value="custom" />
        <label className="sr-only" htmlFor="from">From</label><input id="from" type="date" name="from" defaultValue={from} className="rounded border border-white/15 bg-transparent px-2 py-1 text-xs" />
        <label className="sr-only" htmlFor="to">To</label><input id="to" type="date" name="to" defaultValue={to} className="rounded border border-white/15 bg-transparent px-2 py-1 text-xs" />
        <button className={`rounded-full border px-3 py-1 ${period === "custom" ? "border-transparent bg-brand-gradient text-white" : "border-white/15 text-slate-300"}`}>Custom</button>
      </form>
    </div>
  );
}

export function Table({ head, rows, empty = "No data for this period." }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">{head.map((h, i) => <th key={h} scope="col" className={`py-2 pr-4 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">{r.map((c, j) => <td key={j} className={`py-2 pr-4 ${j > 0 ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "violet" }) {
  const t = { slate: "bg-white/10 text-slate-300", green: "bg-emerald-500/15 text-emerald-300", amber: "bg-amber-500/15 text-amber-300", red: "bg-rose-500/15 text-rose-300", blue: "bg-brand/20 text-brand-400", violet: "bg-violet/20 text-violet-400" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}
export const stageTone = (s: string) => (s === "sales_ready" ? "green" : s === "high_intent" ? "violet" : s === "engaged" ? "blue" : "slate") as "green" | "violet" | "blue" | "slate";
