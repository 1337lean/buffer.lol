import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { waitlistEntries } from "@/lib/db/schema";
import { trackServerEvent } from "@/lib/analytics/events";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const waitlistSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  source: z.string().trim().min(1).max(80).default("public")
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(`waitlist:${ip}`, 8, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const payload = await readPayload(request);
  const parsed = waitlistSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = getDb();
  await db
    .insert(waitlistEntries)
    .values({
      email: parsed.data.email,
      source: parsed.data.source,
      status: "new"
    })
    .onConflictDoUpdate({
      target: waitlistEntries.email,
      set: {
        source: parsed.data.source
      }
    });

  trackServerEvent("waitlist_signup", { source: parsed.data.source });
  return NextResponse.json({ ok: true });
}

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const form = await request.formData();
  return {
    email: form.get("email"),
    source: form.get("source") || "public"
  };
}
