"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, hashPassword, passwordProblem, requireUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { notifyN8n, rescoreLead } from "@/lib/leads";
import { ah } from "@/lib/admin-nav";

// ───────── Leads ─────────
const STATUSES = ["new", "contacted", "qualified", "opportunity", "customer", "disqualified"] as const;

export async function setLeadStatus(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const status = z.enum(STATUSES).parse(fd.get("status"));
  await query("UPDATE leads SET status=$2, updated_at=now() WHERE id=$1", [id, status]);
  await audit(u.id, "lead_status", "lead", id, { status });
  if (status === "qualified") {
    const l = await one<{ name: string; email: string; company: string | null; job_title: string | null; country: string | null }>("SELECT name,email,company,job_title,country FROM leads WHERE id=$1", [id]);
    if (l) void notifyN8n("crm-sync", { leadId: id, ...l }); // n8n workflow asks a human to approve before anything is written to the CRM
  }
  revalidatePath(ah(`/leads/${id}`));
}

export async function addLeadNote(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const note = z.string().trim().min(1).max(4000).parse(fd.get("note"));
  await query("INSERT INTO lead_notes(lead_id,user_id,note) VALUES ($1,$2,$3)", [id, u.id, note]);
  await audit(u.id, "lead_note", "lead", id);
  revalidatePath(ah(`/leads/${id}`));
}

export async function rescoreAction(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  await rescoreLead(id);
  await audit(u.id, "lead_rescore", "lead", id);
  revalidatePath(ah(`/leads/${id}`));
}

/** GDPR erasure: anonymise the lead and delete linked first-party visitor data. Admin only. */
export async function eraseLead(fd: FormData) {
  const u = await requireUser(["admin"]);
  const id = z.string().uuid().parse(fd.get("id"));
  const lead = await one<{ email: string; visitor_id: string | null }>("SELECT email, visitor_id FROM leads WHERE id=$1", [id]);
  if (!lead) return;
  await query("INSERT INTO data_requests(email,kind,status,completed_at) VALUES ($1,'erasure','completed',now())", [lead.email]);
  if (lead.visitor_id) await query("DELETE FROM visitors WHERE id=$1", [lead.visitor_id]); // cascades to events
  await query(`UPDATE leads SET name='Erased', email=('erased-' || id || '@invalid.local')::citext, company=NULL, job_title=NULL, industry=NULL, company_size=NULL, country=NULL,
      service_interest=NULL, product_interest=NULL, message=NULL, visitor_id=NULL, crm_id=NULL, erased_at=now(), updated_at=now() WHERE id=$1`, [id]);
  await query("DELETE FROM lead_notes WHERE lead_id=$1", [id]);
  await audit(u.id, "lead_erased", "lead", id);
  redirect(ah("/leads"));
}

// ───────── Campaigns ─────────
export async function createCampaign(fd: FormData) {
  const u = await requireUser();
  const d = z.object({
    name: z.string().trim().min(2).max(120),
    utm_campaign: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{2,60}$/, "Use lowercase letters, numbers, - or _"),
    channel: z.string().trim().max(60).optional(), objective: z.string().trim().max(300).optional(),
    budget_eur: z.coerce.number().min(0).max(10_000_000).optional(),
  }).parse(Object.fromEntries(fd));
  const row = await one<{ id: string }>("INSERT INTO campaigns(name,utm_campaign,channel,objective,budget_eur) VALUES ($1,$2,$3,$4,$5) RETURNING id", [d.name, d.utm_campaign, d.channel ?? null, d.objective ?? null, d.budget_eur ?? null]);
  await audit(u.id, "campaign_create", "campaign", row?.id);
  redirect(ah(`/campaigns/${row?.id}`));
}

export async function setCampaignStatus(fd: FormData) {
  const u = await requireUser();
  const id = z.string().uuid().parse(fd.get("id"));
  const status = z.enum(["planned", "active", "paused", "completed"]).parse(fd.get("status"));
  await query("UPDATE campaigns SET status=$2 WHERE id=$1", [id, status]);
  await audit(u.id, "campaign_status", "campaign", id, { status });
  revalidatePath(ah(`/campaigns/${id}`));
}

// ───────── Settings: scoring, alerts ─────────
export async function saveScoringRule(fd: FormData) {
  const u = await requireUser(["admin"]);
  const d = z.object({ key: z.string().min(1).max(60), points: z.coerce.number().int().min(-100).max(100), max_count: z.coerce.number().int().min(1).max(50) }).parse(Object.fromEntries(fd));
  await query("UPDATE scoring_rules SET points=$2, max_count=$3, active=$4 WHERE key=$1", [d.key, d.points, d.max_count, fd.get("active") === "on"]);
  await audit(u.id, "scoring_rule", "scoring_rules", d.key, d);
  revalidatePath(ah("/settings"));
}

export async function saveScoringStage(fd: FormData) {
  const u = await requireUser(["admin"]);
  const d = z.object({ stage: z.enum(["early_interest", "engaged", "high_intent", "sales_ready"]), min_score: z.coerce.number().int().min(0).max(1000) }).parse(Object.fromEntries(fd));
  await query("UPDATE scoring_stages SET min_score=$2 WHERE stage=$1", [d.stage, d.min_score]);
  await audit(u.id, "scoring_stage", "scoring_stages", d.stage, d);
  revalidatePath(ah("/settings"));
}

export async function saveAlertRule(fd: FormData) {
  const u = await requireUser(["admin"]);
  const key = z.string().min(1).max(60).parse(fd.get("key"));
  const thr = fd.get("threshold") ? z.coerce.number().min(0).parse(fd.get("threshold")) : null;
  await query("UPDATE alert_rules SET enabled=$2, threshold=$3, channel=$4 WHERE key=$1", [key, fd.get("enabled") === "on", thr, z.enum(["email", "slack", "webhook"]).parse(fd.get("channel") ?? "email")]);
  await audit(u.id, "alert_rule", "alert_rules", key);
  revalidatePath(ah("/settings"));
}

export async function ackAlert(fd: FormData) {
  await requireUser();
  await query("UPDATE alerts SET acknowledged=true WHERE id=$1", [z.coerce.number().int().parse(fd.get("id"))]);
  revalidatePath(ah("/automations"));
}

// ───────── Users (admin only) ─────────
export async function createUser(fd: FormData) {
  const u = await requireUser(["admin"]);
  const d = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email(), role: z.enum(["admin", "marketing"]), password: z.string() }).parse(Object.fromEntries(fd));
  const problem = passwordProblem(d.password);
  if (problem) throw new Error(problem);
  const row = await one<{ id: string }>("INSERT INTO users(name,email,role,password_hash) VALUES ($1,$2,$3,$4) RETURNING id", [d.name, d.email, d.role, await hashPassword(d.password)]);
  await audit(u.id, "user_create", "user", row?.id, { role: d.role });
  revalidatePath(ah("/users"));
}

export async function toggleUser(fd: FormData) {
  const u = await requireUser(["admin"]);
  const id = z.string().uuid().parse(fd.get("id"));
  if (id === u.id) return; // never lock yourself out
  await query("UPDATE users SET disabled = NOT disabled WHERE id=$1", [id]);
  await query("DELETE FROM sessions WHERE user_id=$1", [id]);
  await audit(u.id, "user_toggle", "user", id);
  revalidatePath(ah("/users"));
}
