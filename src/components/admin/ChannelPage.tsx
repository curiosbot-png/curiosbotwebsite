import Link from "next/link";
import { query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { Badge, PageHeader, Panel } from "./ui";

export async function ChannelPage({ title, sub, keys, gates, actions }: { title: string; sub: string; keys: string[]; gates: string[]; actions?: [string, string][] }) {
  const integ = await query<{ key: string; label: string; status: string; last_sync_at: Date | null }>("SELECT key,label,status,last_sync_at FROM integrations WHERE key = ANY($1) ORDER BY label", [keys]);
  const pending = await query<{ workflow: string; created_at: Date; detail: Record<string, unknown> }>("SELECT workflow,created_at,detail FROM automation_runs WHERE status='pending_approval' ORDER BY created_at DESC LIMIT 10");
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <Panel title="Connections"><ul className="space-y-2">{integ.map((i) => <li key={i.key} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"><span>{i.label}</span><Badge tone={i.status === "connected" ? "green" : i.status === "error" ? "red" : "slate"}>{i.status.replace("_", " ")}</Badge></li>)}</ul>
        <p className="mt-3 text-xs text-slate-500">Authorisation is completed by an owner inside n8n (OAuth) — see docs/integrations.md. Until connected, nothing is fetched, posted or spent.</p></Panel>
      <Panel title="Safeguards" className="mt-5"><ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">{gates.map((g) => <li key={g}>{g}</li>)}</ul></Panel>
      {actions && <Panel title="Create" className="mt-5"><div className="flex flex-wrap gap-3">{actions.map(([h, l]) => <Link key={h} href={ah(h)} className="btn-ghost !py-2">{l}</Link>)}</div></Panel>}
      <Panel title="Awaiting approval" className="mt-5">{pending.length ? <ul className="space-y-2 text-sm">{pending.map((p, i) => <li key={i}>{p.workflow} — {p.created_at.toISOString().slice(0, 16).replace("T", " ")}</li>)}</ul> : <p className="text-sm text-slate-400">Nothing waiting for approval.</p>}</Panel>
    </>
  );
}
