import { NextRequest } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  headers: Record<string, string>;
};

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

export function checkRateLimit(request: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const key = `${options.keyPrefix}:${clientKey(request)}`;

  if (now - lastCleanup > options.windowMs) {
    cleanupBuckets(now);
  }

  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }

  const allowed = bucket.count < options.limit;
  if (allowed) bucket.count += 1;

  const remaining = Math.max(0, options.limit - bucket.count);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  return {
    allowed,
    headers: {
      "X-RateLimit-Limit": String(options.limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(bucket.resetAt / 1000)),
      ...(allowed ? {} : { "Retry-After": String(resetSeconds) })
    }
  };
}

function clientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.headers.get("cf-connecting-ip") || forwardedFor || request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") || "unknown-agent";

  return `${ip || "unknown-ip"}:${userAgent}`;
}

function cleanupBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  lastCleanup = now;
}
