import { query } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveAlertRule, saveScoringRule, saveScoringStage } from "../../actions";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Settings" };
export default async function Settings() {
  await requireUser(["admin"]);
  const [rules, stages, alerts, integ] = await Promise.all([
    query<{ key: string; label: string; points: number; max_count: number; active: boolean }>("SELECT key,label,points,max_count,active FROM scoring_rules ORDER BY points"),
    query<{ stage: string; min_score: number }>("SELECT stage,min_score FROM scoring_stages ORDER BY min_score"),
    query<{ key: string; label: string; enabled: boolean; threshold: string | null; channel: string }>("SELECT key,label,enabled,threshold,channel FROM alert_rules ORDER BY key"),
    query<{ key: string; label: string; status: string; last_sync_at: Date | null }>("SELECT key,label,status,last_sync_at FROM integrations ORDER BY label"),
  ]);
  return (
    <>
      <PageHeader title="Settings" sub="Lead scoring uses only behavioural signals and professional data voluntarily provided. Sensitive personal attributes are never used." />
      <Panel title="Lead scoring rules"><ul className="divide-y divide-white/5">{rules.map((r) => (
        <li key={r.key} className="py-2"><form action={saveScoringRule} className="flex flex-wrap items-center gap-3 text-sm"><input type="hidden" name="key" value={r.key} /><span className="min-w-[14rem] flex-1">{r.label}</span>
          <label>Points <input name="points" type="number" defaultValue={r.points} className="field !w-20 !py-1" /></label><label>Max count <input name="max_count" type="number" defaultValue={r.max_count} className="field !w-20 !py-1" /></label>
          <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={r.active} /> active</label><button className="btn-ghost !px-4 !py-1.5">Save</button></form></li>))}</ul></Panel>
      <Panel title="Stage thresholds" className="mt-5"><div className="flex flex-wrap gap-4">{stages.map((s) => <form key={s.stage} action={saveScoringStage} className="flex items-center gap-2 text-sm"><input type="hidden" name="stage" value={s.stage} /><span>{s.stage.replace("_", " ")} ≥</span><input name="min_score" type="number" defaultValue={s.min_score} className="field !w-20 !py-1" /><button className="btn-ghost !px-4 !py-1.5">Save</button></form>)}</div></Panel>
      <Panel title="Alert rules" className="mt-5"><ul className="divide-y divide-white/5">{alerts.map((a) => (
        <li key={a.key} className="py-2"><form action={saveAlertRule} className="flex flex-wrap items-center gap-3 text-sm"><input type="hidden" name="key" value={a.key} /><span className="min-w-[14rem] flex-1">{a.label}</span>
          <label>Threshold <input name="threshold" type="number" step="any" defaultValue={a.threshold ?? ""} className="field !w-24 !py-1" /></label>
          <select name="channel" defaultValue={a.channel} aria-label="Channel" className="field !w-28 !py-1"><option>email</option><option>slack</option><option>webhook</option></select>
          <label className="flex items-center gap-1"><input type="checkbox" name="enabled" defaultChecked={a.enabled} /> on</label><button className="btn-ghost !px-4 !py-1.5">Save</button></form></li>))}</ul></Panel>
      <Panel title="Integrations" className="mt-5" note="credentials are stored in n8n / server env, never here"><ul className="grid gap-2 sm:grid-cols-2">{integ.map((i) => <li key={i.key} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"><span>{i.label}</span><span className="flex items-center gap-2">{i.last_sync_at && <span className="text-xs text-slate-500">{i.last_sync_at.toISOString().slice(0, 10)}</span>}<Badge tone={i.status === "connected" ? "green" : i.status === "error" ? "red" : "slate"}>{i.status.replace("_", " ")}</Badge></span></li>)}</ul></Panel>
    </>
  );
}
