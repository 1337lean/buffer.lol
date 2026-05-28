import http from "http";
import https from "https";
import { resolveSafeProbeNetworkTarget } from "@/lib/probes/validate-url";
import type { SafeProbeNetworkTarget } from "@/lib/probes/validate-url";

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
    const response = await requestWithTimeout(currentUrl, options, (status) => !REDIRECT_STATUSES.has(status));

    if (!REDIRECT_STATUSES.has(response.response.status)) {
      return { response: response.response, url: currentUrl.toString(), bytes: response.bytes, redirects };
    }

    const location = response.response.headers.get("location");
    if (!location) {
      const bytes = new Uint8Array();
      return { response: response.response, url: currentUrl.toString(), bytes, redirects };
    }

    const nextUrl = new URL(location, currentUrl);
    redirects.push({ from: currentUrl.toString(), to: nextUrl.toString(), status: response.response.status });
    currentUrl = nextUrl;
  }

  throw new Error("Probe URL redirected too many times.");
}

export function decodeText(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

async function requestWithTimeout(url: URL, options: SafeFetchOptions, shouldReadBody: (status: number) => boolean) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const target = await resolveSafeProbeNetworkTarget(url);
    return await requestResolvedTarget(target, options, shouldReadBody, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Probe request timed out after ${options.timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

type ResolvedResponse = {
  response: Response;
  bytes: Uint8Array;
};

function requestResolvedTarget(
  target: SafeProbeNetworkTarget,
  options: SafeFetchOptions,
  shouldReadBody: (status: number) => boolean,
  signal: AbortSignal
): Promise<ResolvedResponse> {
  return new Promise((resolve, reject) => {
    const url = target.url;
    const isHttps = url.protocol === "https:";
    const requestHeaders = headersForTarget(options.headers, target);
    const requestOptions: https.RequestOptions = {
      protocol: url.protocol,
      hostname: target.address,
      port: Number(url.port || (isHttps ? 443 : 80)),
      method: options.method ?? "GET",
      path: `${url.pathname}${url.search}`,
      headers: requestHeaders,
      family: target.family,
      servername: isHttps ? target.hostname : undefined,
      rejectUnauthorized: true
    };

    let settled = false;
    const client = isHttps ? https : http;
    const request = client.request(requestOptions, (incoming) => {
      const response = toWebResponse(incoming);

      if (!shouldReadBody(response.status) || options.method === "HEAD") {
        incoming.destroy();
        settle(() => resolve({ response, bytes: new Uint8Array() }));
        return;
      }

      const chunks: Uint8Array[] = [];
      let total = 0;

      incoming.on("data", (chunk: Buffer) => {
        total += chunk.byteLength;
        if (total > options.maxBytes) {
          incoming.destroy(new Error(`Probe response exceeded ${options.maxBytes} bytes.`));
          return;
        }
        chunks.push(chunk);
      });

      incoming.on("end", () => {
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.byteLength;
        }
        settle(() => resolve({ response, bytes }));
      });

      incoming.on("error", (error) => settle(() => reject(error)));
    });

    const abort = () => {
      request.destroy(new Error(`Probe request timed out after ${options.timeoutMs}ms.`));
    };

    function settle(callback: () => void) {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      callback();
    }

    request.on("error", (error) => settle(() => reject(error)));

    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener("abort", abort, { once: true });
      request.end();
    }
  });
}

function toWebResponse(incoming: http.IncomingMessage) {
  return new Response(null, {
    status: normalizeStatusCode(incoming.statusCode),
    statusText: incoming.statusMessage,
    headers: responseHeaders(incoming.headers)
  });
}

function normalizeStatusCode(statusCode: number | undefined) {
  return statusCode && statusCode >= 200 && statusCode <= 599 ? statusCode : 502;
}

function headersForTarget(input: HeadersInit | undefined, target: SafeProbeNetworkTarget) {
  const headers = new Headers(input);
  headers.set("host", target.hostHeader);

  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function responseHeaders(headers: http.IncomingHttpHeaders) {
  const output = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      output.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) output.append(key, item);
    }
  }
  return output;
}
