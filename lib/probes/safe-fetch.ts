import { assertSafeProbeUrl } from "@/lib/probes/validate-url";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type SafeFetchOptions = {
  timeoutMs: number;
  maxBytes: number;
  headers?: HeadersInit;
  method?: "GET" | "HEAD";
  redirectLimit?: number;
};

export type SafeFetchResult = {
  response: Response;
  url: string;
  bytes: Uint8Array;
  redirects: RedirectHop[];
};

export type RedirectHop = {
  from: string;
  to: string;
  status: number;
};

export async function safeFetch(url: string, options: SafeFetchOptions): Promise<SafeFetchResult> {
  const redirectLimit = options.redirectLimit ?? 4;
  let currentUrl = new URL(url);
  const redirects: RedirectHop[] = [];

  for (let redirectCount = 0; redirectCount <= redirectLimit; redirectCount += 1) {
    await assertSafeProbeUrl(currentUrl);
    const response = await fetchWithTimeout(currentUrl.toString(), options);

    if (!REDIRECT_STATUSES.has(response.status)) {
      const bytes = await readLimitedBody(response, options.maxBytes);
      return { response, url: response.url || currentUrl.toString(), bytes, redirects };
    }

    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location) {
      const bytes = new Uint8Array();
      return { response, url: response.url || currentUrl.toString(), bytes, redirects };
    }

    const nextUrl = new URL(location, currentUrl);
    redirects.push({ from: currentUrl.toString(), to: nextUrl.toString(), status: response.status });
    currentUrl = nextUrl;
  }

  throw new Error("Probe URL redirected too many times.");
}

export function decodeText(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function fetchWithTimeout(url: string, options: SafeFetchOptions) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    return await fetch(url, {
      method: options.method ?? "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: options.headers
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimitedBody(response: Response, maxBytes: number) {
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new Error(`Probe response exceeded ${maxBytes} bytes.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}
