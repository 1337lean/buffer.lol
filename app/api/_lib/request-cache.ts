type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
let activeRequests = 0;
let lastCleanup = Date.now();

export async function withCache<T>(key: string, ttlMs: number, factory: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  return dedupe(key, async () => {
    const value = await factory();
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    cleanupCache(Date.now());
    return value;
  });
}

export async function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = factory().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, pending);
  return pending;
}

export async function withConcurrencyLimit<T>(factory: () => Promise<T>): Promise<T> {
  const maxConcurrency = Number(process.env.DIAGNOSTICS_MAX_CONCURRENCY || "20");

  if (Number.isFinite(maxConcurrency) && maxConcurrency > 0 && activeRequests >= maxConcurrency) {
    throw new ConcurrencyLimitError("Diagnostics API is busy. Please try again shortly.");
  }

  activeRequests += 1;

  try {
    return await factory();
  } finally {
    activeRequests -= 1;
  }
}

export class ConcurrencyLimitError extends Error {}

function cleanupCache(now: number) {
  if (now - lastCleanup < 60_000) return;

  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }

  lastCleanup = now;
}
