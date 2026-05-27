import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  if (process.env.RATE_LIMIT_PROVIDER === "memory") {
    return checkMemoryRateLimit(key, limit, windowMs);
  }

  const db = getDb();
  const resetAt = new Date(Date.now() + windowMs).toISOString();
  const rows = await db.execute(sql`
    insert into rate_limit_buckets as bucket (key, count, reset_at, updated_at)
    values (${key}, 1, ${resetAt}, now())
    on conflict (key) do update set
      count = case
        when bucket.reset_at <= now() then 1
        else bucket.count + 1
      end,
      reset_at = case
        when bucket.reset_at <= now() then excluded.reset_at
        else bucket.reset_at
      end,
      updated_at = now()
    returning count, reset_at
  `);
  const row = rows[0] as { count: number; reset_at: Date };
  const rowResetAt = row.reset_at instanceof Date ? row.reset_at.getTime() : new Date(row.reset_at).getTime();

  return {
    allowed: row.count <= limit,
    remaining: Math.max(limit - row.count, 0),
    resetAt: rowResetAt
  };
}

function checkMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || headers.get("x-real-ip") || "unknown";
}
