import { NextRequest, NextResponse } from "next/server";
import { AiNotConfigured, aiModel, runAnalyst } from "@/lib/ai";
import { buildSnapshot } from "@/lib/analyst-data";
import { resolveRange } from "@/lib/analytics";
import { one } from "@/lib/db";
import { bearerOk } from "@/lib/internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called weekly by the n8n "ai-analysis" workflow. Same numeric-traceability guard as the admin UI; result is stored for review.
export async function POST(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"), process.env.N8N_INGEST_SECRET)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const snapshot = await buildSnapshot(resolveRange("7d"));
    const result = await runAnalyst(snapshot);
    const row = await one<{ id: string }>("INSERT INTO ai_generations(kind,input,output,model,status) VALUES ('analyst',$1,$2,$3,'approved') RETURNING id", [JSON.stringify({ period: "7d", snapshot }), JSON.stringify(result), aiModel()]);
    return NextResponse.json({ id: row?.id, insights: result.insights, investigate_next: result.investigate_next });
  } catch (e) {
    return NextResponse.json({ error: e instanceof AiNotConfigured ? "ai_not_configured" : "analysis_failed" }, { status: e instanceof AiNotConfigured ? 503 : 500 });
  }
}
