import { NextResponse } from "next/server";
import { hasDb, query } from "@/lib/db";

export const dynamic = "force-dynamic";
// Liveness/readiness for Docker healthchecks and uptime monitors. Exposes no internals.
export async function GET() {
  try {
    if (hasDb()) await query("SELECT 1");
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
