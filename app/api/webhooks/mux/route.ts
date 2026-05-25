import { NextRequest, NextResponse } from "next/server";
import { logInfo } from "@/lib/observability/log";

export async function POST(request: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("mux-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  logInfo("mux webhook received", { configured: Boolean(secret), type: payload?.type || "unknown" });
  return NextResponse.json({ ok: true });
}
