import { notFound } from "next/navigation";
import { one, query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addLeadNote, eraseLead, rescoreAction, setLeadStatus } from "../../../actions";
import { Badge, PageHeader, Panel, stageTone } from "@/components/admin/ui";

export const metadata = { title: "Lead profile" };
type Lead = { id: string; name: string; email: string; company: string | null; job_title: string | null; industry: string | null; company_size: string | null; country: string | null; service_interest: string | null; product_interest: string | null; message: string | null; kind: string; landing_page: string | null; original_source: string | null; latest_source: string | null; campaign: string | null; utm_medium: string | null; utm_term: string | null; utm_content: string | null; visitor_id: string | null; marketing_consent: boolean; consent_text: string; status: string; score: number; stage: string; score_breakdown: { rule: string; label: string; points: number; count: number }[]; created_at: Date };

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const lead = await one<Lead>("SELECT * FROM leads WHERE id=$1 AND erased_at IS NULL", [id]);
  if (!lead) notFound();
  const [events, notes] = await Promise.all([
    lead.visitor_id ? query<{ type: string; path: string; source: string | null; created_at: Date; value: number | null }>("SELECT type,path,source,created_at,value FROM events WHERE visitor_id=$1 ORDER BY created_at ASC LIMIT 200", [lead.visitor_id]) : Promise.resolve([]),
    query<{ note: string; created_at: Date; name: string | null }>("SELECT n.note,n.created_at,u.name FROM lead_notes n LEFT JOIN users u ON u.id=n.user_id WHERE n.lead_id=$1 ORDER BY n.created_at DESC", [id]),
  ]);
  const F = ({ k, v }: { k: string; v: string | null }) => <div><dt className="text-xs uppercase tracking-wider text-slate-500">{k}</dt><dd className="mt-0.5 text-sm text-slate-200">{v || "—"}</dd></div>;
  return (
    <>
      <PageHeader title={lead.name} sub={`${lead.job_title ?? "—"} · ${lead.company ?? "—"}`} actions={<div className="flex items-center gap-3"><Badge tone={stageTone(lead.stage)}>{lead.stage.replace("_", " ")}</Badge><span className="font-display text-2xl">{lead.score}</span></div>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Contact & company"><dl className="grid gap-4 sm:grid-cols-2"><F k="Email" v={lead.email} /><F k="Country" v={lead.country} /><F k="Company" v={lead.company} /><F k="Industry" v={lead.industry} /><F k="Company size" v={lead.company_size} /><F k="Type" v={lead.kind} /></dl></Panel>
          <Panel title="Interests"><dl className="grid gap-4 sm:grid-cols-2"><F k="Service" v={lead.service_interest} /><F k="Product" v={lead.product_interest} /></dl>{lead.message && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white/5 p-3 text-sm text-slate-300">{lead.message}</p>}</Panel>
          <Panel title="Source & campaign"><dl className="grid gap-4 sm:grid-cols-3"><F k="Original source" v={lead.original_source} /><F k="Latest source" v={lead.latest_source} /><F k="Landing page" v={lead.landing_page} /><F k="Campaign" v={lead.campaign} /><F k="Medium" v={lead.utm_medium} /><F k="Term / content" v={[lead.utm_term, lead.utm_content].filter(Boolean).join(" / ")} /></dl></Panel>
          <Panel title="Consented journey" note={lead.visitor_id ? "analytics + marketing consent given" : "no linked journey"}>
            {events.length ? <ol className="relative space-y-3 border-l border-white/15 pl-5">{events.map((e, i) => <li key={i} className="text-sm"><span className="absolute -ml-[1.65rem] mt-1.5 h-2 w-2 rounded-full bg-signal" /><span className="text-slate-500">{e.created_at.toISOString().slice(0, 16).replace("T", " ")}</span> — <b className="text-slate-200">{e.type.replace("_", " ")}</b> <span className="text-slate-400">{e.path}</span>{e.source && i === 0 ? <span className="text-slate-500"> (from {e.source})</span> : null}</li>)}<li className="text-sm"><span className="absolute -ml-[1.65rem] mt-1.5 h-2 w-2 rounded-full bg-violet" />Submitted a {lead.kind} request</li></ol>
              : <p className="text-sm text-slate-400">This visitor did not consent to journey linking, so only the form submission is recorded.</p>}
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Lead score — why?">
            {lead.score_breakdown.length ? <ul className="space-y-2 text-sm">{lead.score_breakdown.map((b) => <li key={b.rule} className="flex justify-between"><span>{b.label}{b.count > 1 ? ` ×${b.count}` : ""}</span><span className="tabular-nums text-emerald-400">+{b.points}</span></li>)}<li className="flex justify-between border-t border-white/10 pt-2 font-semibold"><span>Total</span><span>{lead.score}</span></li></ul> : <p className="text-sm text-slate-400">No scoring signals.</p>}
            <form action={rescoreAction} className="mt-3"><input type="hidden" name="id" value={lead.id} /><button className="text-sm text-brand-400 hover:underline">Recalculate</button></form>
          </Panel>
          <Panel title="Status">
            <form action={setLeadStatus} className="flex gap-2"><input type="hidden" name="id" value={lead.id} />
              <select name="status" defaultValue={lead.status} className="field !py-2" aria-label="Lead status">{["new", "contacted", "qualified", "opportunity", "customer", "disqualified"].map((s) => <option key={s}>{s}</option>)}</select><button className="btn-ghost !py-2">Save</button></form>
          </Panel>
          <Panel title="Internal notes">
            <form action={addLeadNote} className="space-y-2"><input type="hidden" name="id" value={lead.id} /><label htmlFor="note" className="sr-only">Note</label><textarea id="note" name="note" rows={3} required maxLength={4000} className="field" /><button className="btn-ghost !py-2">Add note</button></form>
            <ul className="mt-4 space-y-3 text-sm">{notes.map((n, i) => <li key={i} className="rounded-lg bg-white/5 p-3"><p className="whitespace-pre-wrap text-slate-200">{n.note}</p><p className="mt-1 text-xs text-slate-500">{n.name ?? "—"} · {n.created_at.toISOString().slice(0, 10)}</p></li>)}</ul>
          </Panel>
          <Panel title="Consent record"><p className="text-sm text-slate-300">{lead.consent_text}</p><p className="mt-1 text-xs text-slate-500">Marketing consent: {lead.marketing_consent ? "yes" : "no"} · {lead.created_at.toISOString().slice(0, 10)}</p>
            {user.role === "admin" && <form action={eraseLead} className="mt-4"><input type="hidden" name="id" value={lead.id} /><button className="text-sm text-rose-400 hover:underline">Erase this lead (GDPR)</button></form>}</Panel>
        </div>
      </div>
    </>
  );
}
