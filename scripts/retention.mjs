#!/usr/bin/env node
// GDPR data-retention purge. Run daily (cron on the VPS, or an n8n Schedule + `docker compose exec web node scripts/retention.mjs`).
// Defaults: raw events 25 months, expired sessions/rate limits/resets 7 days, leads NOT auto-deleted (business relationship; erase on request via admin).
import pg from "pg";
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL required"); process.exit(1); }
const months = Number(process.env.RETENTION_EVENT_MONTHS || 25);
const db = new pg.Client({ connectionString: url });
await db.connect();
const q = async (sql, p = []) => (await db.query(sql, p)).rowCount;
console.log("events purged:", await q("DELETE FROM events WHERE created_at < now() - ($1::int * interval '1 month')", [months]));
console.log("orphan visitors purged:", await q("DELETE FROM visitors v WHERE v.lead_id IS NULL AND NOT EXISTS (SELECT 1 FROM events e WHERE e.visitor_id=v.id) AND NOT EXISTS (SELECT 1 FROM leads l WHERE l.visitor_id=v.id) AND v.last_seen < now() - interval '30 days'"));
console.log("sessions purged:", await q("DELETE FROM sessions WHERE expires_at < now() - interval '7 days'"));
console.log("password resets purged:", await q("DELETE FROM password_resets WHERE expires_at < now() - interval '7 days'"));
console.log("rate limits purged:", await q("DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'"));
await db.end();
