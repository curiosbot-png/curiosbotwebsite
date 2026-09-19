import { one, query } from "./db";
import { scoreLead, type ScoringEvent, type ScoringRule, type StageThreshold } from "./scoring";

export async function rescoreLead(leadId: string) {
  const lead = await one<{ visitor_id: string | null; kind: string }>("SELECT visitor_id, kind FROM leads WHERE id=$1", [leadId]);
  if (!lead) return null;
  const [rules, stages] = await Promise.all([
    query<ScoringRule>("SELECT * FROM scoring_rules"), query<StageThreshold>("SELECT stage, min_score FROM scoring_stages"),
  ]);
  const events = lead.visitor_id
    ? await query<{ type: string; content_type: string | null; day: string }>(
        "SELECT type, content_type, to_char(created_at,'YYYY-MM-DD') AS day FROM events WHERE visitor_id=$1", [lead.visitor_id])
    : [];
  // The submission itself always counts, even when the visitor had no tracked history.
  const submit: ScoringEvent[] = [{ type: lead.kind === "demo" ? "demo_request" : "form_submit", content_type: null, day: new Date().toISOString().slice(0, 10) }];
  const result = scoreLead([...(events as ScoringEvent[]), ...submit], rules, stages);
  await query("UPDATE leads SET score=$2, stage=$3, score_breakdown=$4, updated_at=now() WHERE id=$1", [leadId, result.score, result.stage, JSON.stringify(result.breakdown)]);
  return result;
}

/** Fire-and-forget webhook to n8n (internal network). Auth is a bearer secret checked by the n8n Webhook node's Header Auth credential.
 *  Failures are logged to automation_runs and never thrown to the visitor/admin. */
export async function notifyN8n(event: string, payload: object) {
  const url = process.env.N8N_WEBHOOK_BASE_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) return;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/${event}`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ event, at: new Date().toISOString(), ...payload }), signal: AbortSignal.timeout(8000),
    });
    await query("INSERT INTO automation_runs(workflow, status, detail) VALUES ($1,$2,$3)", [event, res.ok ? "success" : "error", JSON.stringify({ status: res.status })]);
  } catch (e) {
    await query("INSERT INTO automation_runs(workflow, status, detail) VALUES ($1,'error',$2)", [event, JSON.stringify({ error: String(e).slice(0, 200) })]).catch(() => {});
  }
}
