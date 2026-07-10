import { NextRequest } from "next/server";
import { getRateLimitIdentity } from "./client-ip";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  targetKey?: string;
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
const MAX_MEMORY_BUCKETS = 10_000;
let lastCleanup = Date.now();

export async function checkRateLimit(request: NextRequest, options: RateLimitOptions): Promise<RateLimitResult> {
  const identity = getRateLimitIdentity(request);
  const key = `${options.keyPrefix}:${identity.key}:${options.targetKey || "any-target"}`;

  if (hasUpstashConfig()) {
    return checkUpstashRateLimit(key, options).catch(() => checkMemoryRateLimit(key, options));
  }

  return checkMemoryRateLimit(key, options);
}

function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (now - lastCleanup > options.windowMs) {
    cleanupBuckets(now);
  }

  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
    trimBuckets();
  }

  const allowed = bucket.count < options.limit;
  if (allowed) bucket.count += 1;

  return toRateLimitResult(allowed, options.limit, Math.max(0, options.limit - bucket.count), bucket.resetAt);
}

function trimBuckets() {
  while (buckets.size > MAX_MEMORY_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (typeof oldestKey !== "string") break;
    buckets.delete(oldestKey);
  }
}

async function checkUpstashRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  const windowId = Math.floor(Date.now() / options.windowMs);
  const redisKey = `rate:${key}:${windowId}`;
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, options.windowMs + 1_000],
      ["PTTL", redisKey]
    ]),
    signal: AbortSignal.timeout(2_000)
  });

  if (!response.ok) {
    return checkMemoryRateLimit(key, options);
  }

  const results = await response.json() as Array<{ result?: unknown }>;
  const count = Number(results[0]?.result || 0);
  const ttl = Number(results[2]?.result || options.windowMs);
  const resetAt = Date.now() + Math.max(0, ttl);
  const allowed = count <= options.limit;

  return toRateLimitResult(allowed, options.limit, Math.max(0, options.limit - count), resetAt);
}

function toRateLimitResult(allowed: boolean, limit: number, remaining: number, resetAt: number): RateLimitResult {
  const resetSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return {
    allowed,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      ...(allowed ? {} : { "Retry-After": String(resetSeconds) })
    }
  };
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function cleanupBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  lastCleanup = now;
}
