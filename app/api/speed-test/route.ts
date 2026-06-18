import { NextRequest, NextResponse } from "next/server";

const MAX_DOWNLOAD_BYTES = 12 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const DEFAULT_DOWNLOAD_BYTES = 2 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const bytes = clampByteCount(request.nextUrl.searchParams.get("bytes"), DEFAULT_DOWNLOAD_BYTES, MAX_DOWNLOAD_BYTES);
  const payload = new Uint8Array(bytes);

  for (let index = 0; index < payload.length; index += 1) {
    payload[index] = index % 251;
  }

  return new NextResponse(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Length": String(bytes),
      "Content-Type": "application/octet-stream",
      "X-Test-Bytes": String(bytes)
    }
  });
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Upload test payload is too large." }, { status: 413 });
  }

  const body = await request.arrayBuffer();

  if (body.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Upload test payload is too large." }, { status: 413 });
  }

  return NextResponse.json(
    {
      ok: true,
      bytes: body.byteLength,
      receivedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}

function clampByteCount(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1024, Math.floor(parsed)));
}
