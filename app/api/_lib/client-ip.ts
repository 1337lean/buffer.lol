import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { isIpLiteral, normalizeIpLiteral } from "./ip";

export type ClientIpResult = {
  ip: string | null;
  source: "cf-connecting-ip" | "x-real-ip" | "x-forwarded-for" | "unavailable";
  trustedProxyHeaders: boolean;
};

export function getClientIp(request: NextRequest): ClientIpResult {
  if (!trustProxyHeaders()) {
    return { ip: null, source: "unavailable", trustedProxyHeaders: false };
  }

  const candidates: Array<[ClientIpResult["source"], string | null]> = [
    ["cf-connecting-ip", request.headers.get("cf-connecting-ip")],
    ["x-real-ip", request.headers.get("x-real-ip")],
    ["x-forwarded-for", firstForwardedFor(request.headers.get("x-forwarded-for"))]
  ];

  for (const [source, value] of candidates) {
    const ip = normalizeHeaderIp(value);
    if (ip) return { ip, source, trustedProxyHeaders: true };
  }

  return { ip: null, source: "unavailable", trustedProxyHeaders: true };
}

export function getRateLimitIdentity(request: NextRequest) {
  const client = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const rawIdentity = `${client.ip || "unknown-ip"}:${userAgent}`;

  return {
    client,
    key: createHash("sha256").update(rawIdentity).digest("hex").slice(0, 32)
  };
}

export function trustProxyHeaders() {
  if (process.env.TRUST_PROXY_HEADERS === "true") return true;
  if (process.env.TRUST_PROXY_HEADERS === "false") return false;

  const platform = process.env.TRUSTED_PROXY_PLATFORM?.toLowerCase();
  return (
    platform === "vercel" ||
    platform === "netlify" ||
    platform === "cloudflare" ||
    process.env.VERCEL === "1" ||
    process.env.NETLIFY === "true" ||
    process.env.CF_PAGES === "1"
  );
}

function firstForwardedFor(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeHeaderIp(value: string | null) {
  if (!value) return null;

  const normalized = normalizeIpLiteral(value);
  return isIpLiteral(normalized) ? normalized : null;
}
