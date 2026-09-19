import Link from "next/link";
import { query } from "@/lib/db";
import { ah } from "@/lib/admin-nav";
import { parseRange, type SP } from "@/lib/params";
import { Badge, PageHeader, Panel, PeriodPicker, Table, stageTone, fmt } from "@/components/admin/ui";

export const metadata = { title: "Leads" };

export default async function Leads({ searchParams }: { searchParams: SP }) {
  const { period, from, to, range, get } = await parseRange(searchParams);
  const stage = get("stage"), status = get("status");
  const rows = await query<{ id: string; name: string; company: string | null; job_title: string | null; email: string; kind: string; score: number; stage: string; status: string; campaign: string | null; original_source: string | null; created_at: Date }>(
    `SELECT id,name,company,job_title,email,kind,score,stage,status,campaign,original_source,created_at FROM leads
     WHERE erased_at IS NULL AND created_at >= $1 AND created_at < $2 AND ($3::text IS NULL OR stage::text=$3) AND ($4::text IS NULL OR status::text=$4)
     ORDER BY created_at DESC LIMIT 200`, [range.from, range.to, stage ?? null, status ?? null]);
  return (
    <>
      <PageHeader title="Leads" actions={<PeriodPicker base="/leads" period={period} from={from} to={to} extra={{ stage, status }} />} />
      <form method="get" className="mb-4 flex flex-wrap gap-3 text-sm">
        <input type="hidden" name="p" value={period} />
        <label>Stage<select name="stage" defaultValue={stage ?? ""} className="field mt-1 !py-2"><option value="">All</option>{["early_interest", "engaged", "high_intent", "sales_ready"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Status<select name="status" defaultValue={status ?? ""} className="field mt-1 !py-2"><option value="">All</option>{["new", "contacted", "qualified", "opportunity", "customer", "disqualified"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <button className="btn-ghost self-end !py-2">Filter</button>
      </form>
      <Panel>
        <Table head={["Lead", "Company / role", "Type", "Source", "Campaign", "Score", "Stage", "Status", "Created"]}
          rows={rows.map((l) => [<Link key={l.id} href={ah(`/leads/${l.id}`)} className="text-brand-400 hover:underline">{l.name}</Link>, `${l.company ?? "—"}${l.job_title ? ` · ${l.job_title}` : ""}`, l.kind, l.original_source ?? "—", l.campaign ?? "—", fmt(l.score), <Badge key="s" tone={stageTone(l.stage)}>{l.stage.replace("_", " ")}</Badge>, l.status, l.created_at.toISOString().slice(0, 10)])} empty="No leads match." />
      </Panel>
    </>
  );
}
