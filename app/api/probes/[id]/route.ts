import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probeEvents, probeMetrics, probes, reports } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(data.user.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const { id } = await params;
  const db = getDb();
  const [probe] = await db
    .select()
    .from(probes)
    .where(and(eq(probes.id, id), eq(probes.teamId, workspace.teamId)))
    .limit(1);

  if (!probe) return NextResponse.json({ error: "Probe not found" }, { status: 404 });

  const [events, metricsRows, reportRows] = await Promise.all([
    db.select().from(probeEvents).where(eq(probeEvents.probeId, id)).orderBy(asc(probeEvents.createdAt)),
    db.select().from(probeMetrics).where(eq(probeMetrics.probeId, id)).limit(1),
    db.select().from(reports).where(eq(reports.probeId, id)).limit(1)
  ]);

  return NextResponse.json({
    probe,
    events,
    metrics: metricsRows[0] ?? null,
    report: reportRows[0] ?? null
  });
}
