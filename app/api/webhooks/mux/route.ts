import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/observability/log";

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;
const HEX_SIGNATURE_RE = /^[0-9a-f]{64}$/i;

export async function POST(request: NextRequest) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    logError("mux webhook secret missing", new Error("MUX_WEBHOOK_SECRET is required in production."));
    return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();

  if (secret) {
    const signature = request.headers.get("mux-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 401 });
    if (!verifyMuxSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }
  }

  const payload = parseJson(rawBody);
  logInfo("mux webhook received", { configured: Boolean(secret), type: payload?.type || "unknown" });
  return NextResponse.json({ ok: true });
}

function verifyMuxSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return signatures.some((signature) => safeCompare(signature, expected));
}

function safeCompare(actualHex: string, expectedHex: string) {
  if (!HEX_SIGNATURE_RE.test(actualHex)) return false;
  const actual = Buffer.from(actualHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function parseJson(rawBody: string) {
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
