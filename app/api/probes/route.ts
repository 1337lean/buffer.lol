import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentWorkspace } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { probeEvents, probes } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { enqueueProbe } from "@/lib/queue/enqueue-probe";
import { probeInputSchema, validateProbeUrl } from "@/lib/probes/validate-url";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { trackServerEvent } from "@/lib/analytics/events";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(auth.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const db = getDb();
  const rows = await db
    .select()
    .from(probes)
    .where(eq(probes.teamId, workspace.teamId))
    .orderBy(desc(probes.createdAt))
    .limit(50);

  return NextResponse.json({ probes: rows });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspace = await getCurrentWorkspace(auth.id);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const userLimit = checkRateLimit(`probe:user:${auth.id}`, 20, 60 * 60 * 1000);
  const teamLimit = checkRateLimit(`probe:team:${workspace.teamId}`, 80, 60 * 60 * 1000);
  if (!userLimit.allowed || !teamLimit.allowed) {
    return NextResponse.json({ error: "Probe rate limit reached. Try again later." }, { status: 429 });
  }

  const parsed = probeInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid probe request." }, { status: 400 });
  }

  let safeUrl: string;
  try {
    safeUrl = await validateProbeUrl(parsed.data.url);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid probe URL." }, { status: 400 });
  }

  const db = getDb();
  const [probe] = await db
    .insert(probes)
    .values({
      teamId: workspace.teamId,
      createdBy: auth.id,
      url: safeUrl,
      probeType: parsed.data.probeType,
      region: parsed.data.region,
      status: "queued",
      summary: "Probe queued for diagnostics."
    })
    .returning();

  await db.insert(probeEvents).values({
    probeId: probe.id,
    level: "system",
    message: "Probe queued.",
    metadata: { queueProvider: process.env.QUEUE_PROVIDER || "inline" }
  });

  await enqueueProbe(probe.id);
  trackServerEvent("probe_created", { probeId: probe.id, probeType: probe.probeType, region: probe.region });

  return NextResponse.json({ probeId: probe.id }, { status: 201 });
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
