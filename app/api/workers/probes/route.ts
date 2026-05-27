import { timingSafeEqual } from "crypto";
import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { probes } from "@/lib/db/schema";
import { logError, logInfo } from "@/lib/observability/log";
import { processProbe } from "@/workers/probe-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorkerRequestBody = {
  probeId?: unknown;
};

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await readBody(request);
    const probeId = typeof body.probeId === "string" && body.probeId.trim()
      ? body.probeId.trim()
      : await getNextQueuedProbeId();

    if (!probeId) {
      return NextResponse.json({ ok: true, processed: false, reason: "No queued probes." });
    }

    await processProbe(probeId);
    logInfo("probe worker processed job", { probeId });
    return NextResponse.json({ ok: true, processed: true, probeId });
  } catch (error) {
    logError("probe worker failed", error);
    return NextResponse.json({ error: "Probe worker failed." }, { status: 500 });
  }
}

async function getNextQueuedProbeId() {
  const db = getDb();
  const [probe] = await db
    .select({ id: probes.id })
    .from(probes)
    .where(eq(probes.status, "queued"))
    .orderBy(asc(probes.createdAt))
    .limit(1);

  return probe?.id ?? null;
}

async function readBody(request: NextRequest): Promise<WorkerRequestBody> {
  const text = await request.text();
  if (!text.trim()) return {};

  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed as WorkerRequestBody : {};
  } catch {
    throw new Error("Invalid worker request body.");
  }
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  return safeCompare(token, secret);
}

function safeCompare(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
