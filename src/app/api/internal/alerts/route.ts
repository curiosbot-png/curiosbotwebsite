import { NextRequest, NextResponse } from "next/server";
import { evaluateAlerts } from "@/lib/alerts";
import { bearerOk } from "@/lib/internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called hourly by the n8n "alerts" workflow. Returns only NEW alerts so n8n can notify.
export async function POST(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"), process.env.N8N_INGEST_SECRET)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ alerts: await evaluateAlerts() });
}
