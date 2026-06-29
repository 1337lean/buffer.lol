import { promises as dns } from "node:dns";
import { createHash } from "node:crypto";
import net from "node:net";
import tls from "node:tls";
import { domainToASCII } from "node:url";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "../../_lib/client-ip";
import { ConcurrencyLimitError, dedupe, withCache, withConcurrencyLimit } from "../../_lib/request-cache";
import { checkRateLimit } from "../../_lib/rate-limit";
import { isPublicIp, normalizeIpLiteral } from "../../_lib/ip";

type RouteContext = { params: Promise<{ slug: string }> };
type JsonRecord = Record<string, unknown>;
type LookupAddress = { address: string; family: number };
type Envelope = { data?: unknown; error?: string; durationMs: number; requestId: string };

const FETCH_TIMEOUT_MS = 8_000;
const TCP_TIMEOUT_MS = 7_000;
const MAX_TEXT_BYTES = 128 * 1024;
const MAX_BODY_BYTES = 4 * 1024;
const USER_AGENT = "buffer.lol diagnostics/0.1";
const DNS_CACHE_TTL_MS = 60_000;
const RDAP_CACHE_TTL_MS = 60 * 60_000;
const ASN_CACHE_TTL_MS = 30 * 60_000;
const LIVE_DEDUPE_MS = 1_500;

const implementedTools = new Set([
  "dns-lookup",
  "http-headers",
  "ssl-checker",
  "uptime",
  "port-checker",
  "whois-lookup",
  "redirect-checker",
  "robots-sitemap",
  "my-ip",
  "ip-geolocation",
  "asn-lookup"
]);

const workerOnlyTools: Record<string, string> = {
  ping: "ICMP ping requires a container or VM worker with raw socket permissions.",
  "packet-loss": "Packet-loss sampling requires a container or VM worker with ICMP support.",
  traceroute: "Traceroute requires a container or VM worker with traceroute privileges."
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest, context: RouteContext) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const { slug } = await context.params;
  let responseHeaders: Record<string, string> = {};

  try {
    if (!implementedTools.has(slug) && !workerOnlyTools[slug]) {
      throw new ApiError("Unknown tool endpoint.", 404);
    }

    enforceSameOrigin(request);
    enforceBodySize(request);

    const body = await readJsonBody(request);
    const input = typeof body.input === "string" ? body.input : "";
    const rateLimit = await checkRateLimit(request, {
      keyPrefix: `tools:${slug}`,
      limit: 30,
      windowMs: 60_000,
      targetKey: hashKey(input.trim().toLowerCase() || "empty")
    });
    responseHeaders = rateLimit.headers;

    if (!rateLimit.allowed) {
      return envelope({
        error: "Too many requests. Please slow down and try again shortly.",
        started,
        requestId,
        status: 429,
        headers: responseHeaders
      });
    }

    const data = await dedupe(`live:${slug}:${hashKey(input)}:${Math.floor(Date.now() / LIVE_DEDUPE_MS)}`, () =>
      withConcurrencyLimit(() => workerOnlyTools[slug]
        ? runWorkerTool(slug, input, requestId)
        : runTool(slug, input, request))
    );

    return envelope({ data, started, requestId, headers: responseHeaders });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ConcurrencyLimitError ? 503 : 500;
    const message = error instanceof Error ? error.message : "Unexpected backend error.";

    return envelope({ error: message, started, requestId, status, headers: responseHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  try {
    enforceSameOrigin(request);
  } catch {
    return new NextResponse(null, { status: 403, headers: { Vary: "Origin" } });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      Vary: "Origin"
    }
  });
}

async function runWorkerTool(slug: string, input: string, requestId: string) {
  if (process.env.ENABLE_WORKER_TOOLS !== "true") {
    throw new ApiError(`${workerOnlyTools[slug]} Worker-backed tools are disabled until the worker health check is green.`, 501);
  }

  const workerUrl = process.env.DIAGNOSTICS_WORKER_URL;
  if (!workerUrl) throw new ApiError("Worker-backed tools are enabled, but DIAGNOSTICS_WORKER_URL is not configured.", 503);

  const endpoint = new URL(`/api/${slug}`, workerUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "X-Request-Id": requestId,
      ...(process.env.DIAGNOSTICS_WORKER_TOKEN ? { Authorization: `Bearer ${process.env.DIAGNOSTICS_WORKER_TOKEN}` } : {})
    },
    body: JSON.stringify({ input }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  }).catch((error: unknown) => {
    throw fetchErrorToApiError(error);
  });

  const payload = await response.json().catch(() => ({})) as Envelope;

  if (!response.ok || payload.error) {
    throw new ApiError(payload.error || `Worker returned HTTP ${response.status}.`, response.ok ? 502 : response.status);
  }

  return payload.data;
}

function enforceSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new ApiError("Cross-origin API requests are not allowed.", 403);
  }

  const requestOrigin = new URL(request.url);
  const allowedHosts = new Set([
    requestOrigin.host,
    request.headers.get("host"),
    firstHeaderValue(request.headers.get("x-forwarded-host"))
  ].filter(Boolean));

  if (!allowedHosts.has(originUrl.host)) {
    throw new ApiError("Cross-origin API requests are not allowed.", 403);
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function enforceBodySize(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) throw new ApiError("Request body is too large.", 413);
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

async function runTool(slug: string, input: string, request: NextRequest) {
  switch (slug) {
    case "dns-lookup":
      return lookupDns(input);
    case "http-headers":
      return inspectHeaders(input);
    case "ssl-checker":
      return inspectTlsCertificate(input);
    case "uptime":
      return checkUptime(input);
    case "port-checker":
      return checkPort(input);
    case "whois-lookup":
      return lookupRdap(input);
    case "redirect-checker":
      return checkRedirects(input);
    case "robots-sitemap":
      return inspectRobotsAndSitemap(input);
    case "my-ip":
      return detectClientIp(request);
    case "ip-geolocation":
      return lookupIpNetwork(input);
    case "asn-lookup":
      return lookupAsn(input);
    default:
      throw new ApiError("Unknown tool endpoint.", 404);
  }
}

async function lookupDns(input: string) {
  const domain = normalizeHostname(requireInput(input, "Enter a domain name."));

  return withCache(`dns:${domain}`, DNS_CACHE_TTL_MS, async () => {
    const lookups = await Promise.allSettled([
      resolveRecord("A", () => dns.resolve4(domain)),
      resolveRecord("AAAA", () => dns.resolve6(domain)),
      resolveRecord("MX", () => dns.resolveMx(domain)),
      resolveRecord("TXT", async () => (await dns.resolveTxt(domain)).map((record) => record.join(""))),
      resolveRecord("CNAME", () => dns.resolveCname(domain)),
      resolveRecord("NS", () => dns.resolveNs(domain)),
      resolveRecord("SOA", () => dns.resolveSoa(domain))
    ]);

    const records: JsonRecord = {};
    const errors: JsonRecord = {};

    for (const result of lookups) {
      if (result.status === "fulfilled") {
        records[result.value.type] = result.value.records;
        if (result.value.error) errors[result.value.type] = result.value.error;
      }
    }

    return { domain, records, errors };
  });
}

async function inspectHeaders(input: string) {
  const url = normalizeHttpUrl(input);
  await resolvePublicHost(url.hostname);

  const started = Date.now();
  let response = await safeFetch(url, { method: "HEAD" });

  if (response.status === 405 || response.status === 501) {
    response = await safeFetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
  }

  return {
    url: url.href,
    status: response.status,
    statusText: response.statusText,
    responseTimeMs: Date.now() - started,
    headers: headersToObject(response.headers)
  };
}

async function checkUptime(input: string) {
  const url = normalizeHttpUrl(input);
  await resolvePublicHost(url.hostname);

  const started = Date.now();
  let response = await safeFetch(url, { method: "HEAD" });

  if (response.status === 405 || response.status === 501) {
    response = await safeFetch(url, { method: "GET", headers: { Range: "bytes=0-0" } });
  }

  return {
    url: url.href,
    online: response.status < 500,
    status: response.status,
    statusText: response.statusText,
    responseTimeMs: Date.now() - started
  };
}

async function checkRedirects(input: string) {
  let currentUrl = normalizeHttpUrl(input);
  const chain = [];

  for (let hop = 0; hop < 8; hop += 1) {
    await resolvePublicHost(currentUrl.hostname);

    const started = Date.now();
    const response = await safeFetch(currentUrl, { method: "HEAD" });
    const location = response.headers.get("location");

    chain.push({
      url: currentUrl.href,
      status: response.status,
      statusText: response.statusText,
      location,
      responseTimeMs: Date.now() - started
    });

    if (!isRedirectStatus(response.status) || !location) {
      return { finalUrl: currentUrl.href, hopCount: chain.length - 1, chain };
    }

    currentUrl = normalizeHttpUrl(new URL(location, currentUrl).href);
  }

  return { finalUrl: currentUrl.href, hopCount: chain.length, tooManyRedirects: true, chain };
}

async function inspectRobotsAndSitemap(input: string) {
  const url = normalizeHttpUrl(input);
  const origin = new URL(url.origin);
  await resolvePublicHost(origin.hostname);

  const robotsUrl = new URL("/robots.txt", origin);
  const sitemapUrl = new URL("/sitemap.xml", origin);
  const [robotsResponse, sitemapResponse] = await Promise.all([
    safeFetch(robotsUrl, { method: "GET" }),
    safeFetch(sitemapUrl, { method: "HEAD" })
  ]);
  const robotsText = robotsResponse.ok ? await readLimitedText(robotsResponse, MAX_TEXT_BYTES) : "";
  const declaredSitemaps = Array.from(robotsText.matchAll(/^sitemap:\s*(.+)$/gim), (match) => match[1].trim()).slice(0, 25);

  return {
    origin: origin.href,
    robots: {
      url: robotsUrl.href,
      status: robotsResponse.status,
      exists: robotsResponse.ok,
      bytesRead: Buffer.byteLength(robotsText),
      declaredSitemaps,
      preview: robotsText.split(/\r?\n/).slice(0, 40)
    },
    sitemap: {
      url: sitemapUrl.href,
      status: sitemapResponse.status,
      exists: sitemapResponse.ok,
      contentType: sitemapResponse.headers.get("content-type")
    }
  };
}

async function inspectTlsCertificate(input: string) {
  const { host, port } = parseHostAndPort(input, 443);
  const hostname = normalizeHostname(host);
  const addresses = await resolvePublicHost(hostname);
  const address = addresses[0].address;
  const started = Date.now();
  const certificate = await readCertificate(address, hostname, port);

  return {
    host: hostname,
    address,
    port,
    authorized: certificate.authorized,
    authorizationError: certificate.authorizationError,
    protocol: certificate.protocol,
    cipher: certificate.cipher,
    responseTimeMs: Date.now() - started,
    certificate: certificate.peerCertificate
  };
}

async function checkPort(input: string) {
  const { host, port } = parseHostAndPort(requireInput(input, "Enter a host and port."), undefined);
  const hostname = normalizeHostname(host);
  const addresses = await resolvePublicHost(hostname);
  const started = Date.now();
  const result = await connectTcp(addresses[0].address, port);

  return {
    host: hostname,
    address: addresses[0].address,
    port,
    reachable: result.reachable,
    error: result.error,
    responseTimeMs: Date.now() - started
  };
}

async function lookupRdap(input: string) {
  const target = normalizeLookupTarget(input);
  const rdapUrl = net.isIP(target) ? `https://rdap.org/ip/${target}` : `https://rdap.org/domain/${target}`;
  const data = await fetchJson(rdapUrl, `rdap:${target}`, RDAP_CACHE_TTL_MS);

  return { provider: "rdap.org", ...summarizeRdap(target, data) };
}

function detectClientIp(request: NextRequest) {
  const client = getClientIp(request);

  return {
    ip: client.ip || "Unavailable in this runtime",
    source: client.source,
    trustedProxyHeaders: client.trustedProxyHeaders,
    headerPrecedence: ["cf-connecting-ip", "x-real-ip", "x-forwarded-for"],
    note: client.trustedProxyHeaders
      ? "Production proxy headers are trusted by configuration, and Cloudflare's visitor header wins when present."
      : "Proxy IP headers are ignored until TRUST_PROXY_HEADERS=true or a trusted platform is configured."
  };
}

async function lookupIpNetwork(input: string) {
  const ip = requirePublicIp(input);
  const [rdap, asn] = await Promise.allSettled([fetchJson(`https://rdap.org/ip/${ip}`, `rdap:${ip}`, RDAP_CACHE_TTL_MS), lookupAsn(ip)]);
  const rdapData = rdap.status === "fulfilled" ? rdap.value : {};
  const summary = summarizeRdap(ip, rdapData);

  return {
    ip,
    providers: ["rdap.org", "Team Cymru"],
    country: stringField(rdapData.country),
    network: summary,
    asn: asn.status === "fulfilled" ? asn.value : null
  };
}

async function lookupAsn(input: string) {
  const target = requireInput(input, "Enter a public IP address or ASN.").toUpperCase().replace(/^AS\s*/, "AS");
  const asnMatch = target.match(/^AS?(\d{1,10})$/);
  const query = asnMatch ? `AS${asnMatch[1]}.asn.cymru.com` : toCymruOriginQuery(requirePublicIp(target));

  return withCache(`asn:${query}`, ASN_CACHE_TTL_MS, async () => {
    const rows = await dns.resolveTxt(query);
    const parsedRows = rows.map((row) => parseCymruRow(row.join("")));

    return {
      provider: "Team Cymru",
      query: target,
      records: parsedRows
    };
  });
}

async function resolveRecord(type: string, resolver: () => Promise<unknown>) {
  try {
    return { type, records: await resolver() };
  } catch (error) {
    return { type, records: [], error: dnsErrorMessage(error) };
  }
}

async function readJsonBody(request: NextRequest) {
  try {
    const body = await request.json();
    return isRecord(body) ? body : {};
  } catch {
    return {};
  }
}

function envelope(options: { data?: unknown; error?: string; started: number; requestId: string; status?: number; headers?: Record<string, string> }) {
  const payload: Envelope = {
    durationMs: Date.now() - options.started,
    requestId: options.requestId
  };

  if (options.error) payload.error = options.error;
  else payload.data = options.data;

  return NextResponse.json(payload, {
    status: options.status ?? 200,
    headers: { "Cache-Control": "no-store, max-age=0", ...(options.headers ?? {}) }
  });
}

function requireInput(input: string, message: string) {
  const value = input.trim();
  if (!value) throw new ApiError(message, 400);
  if (value.length > 2048) throw new ApiError("Input is too long.", 400);
  return value;
}

function normalizeHttpUrl(input: string) {
  const raw = requireInput(input, "Enter a URL.");
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new ApiError("Enter a valid HTTP or HTTPS URL.", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError("Only HTTP and HTTPS URLs are supported.", 400);
  }

  if (url.username || url.password) {
    throw new ApiError("URLs with embedded credentials are not allowed.", 400);
  }

  url.hostname = normalizeHostname(url.hostname);
  return url;
}

function normalizeLookupTarget(input: string) {
  const raw = requireInput(input, "Enter a domain or public IP address.");
  const maybeIp = normalizeIpLiteral(raw);

  if (net.isIP(maybeIp)) {
    if (!isPublicIp(maybeIp)) throw new ApiError("Private, local, reserved, and multicast IPs are not allowed.", 400);
    return maybeIp;
  }

  return normalizeHostname(raw.replace(/^https?:\/\//i, "").split("/")[0]);
}

function normalizeHostname(input: string) {
  const raw = normalizeIpLiteral(input).replace(/\.$/, "").toLowerCase();

  if (net.isIP(raw)) {
    if (!isPublicIp(raw)) throw new ApiError("Private, local, reserved, and multicast IPs are not allowed.", 400);
    return raw;
  }

  const ascii = domainToASCII(raw);
  const labels = ascii.split(".");

  if (!ascii || ascii.length > 253 || labels.length < 2) {
    throw new ApiError("Enter a valid public hostname.", 400);
  }

  if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    throw new ApiError("Enter a valid public hostname.", 400);
  }

  return ascii;
}

function parseHostAndPort(input: string, defaultPort: number | undefined) {
  const raw = requireInput(input, defaultPort ? "Enter a hostname." : "Enter a host and port.");
  let fromUrl: URL | null = null;

  if (raw.includes("://")) {
    try {
      fromUrl = new URL(raw);
    } catch {
      throw new ApiError("Enter a valid host and port.", 400);
    }
  }

  if (fromUrl) {
    if (fromUrl.username || fromUrl.password) {
      throw new ApiError("URLs with embedded credentials are not allowed.", 400);
    }

    return {
      host: fromUrl.hostname,
      port: parsePort(fromUrl.port || String(defaultPort), Boolean(defaultPort))
    };
  }

  if (raw.startsWith("[")) {
    const match = raw.match(/^\[([^\]]+)\](?::(\d+))?$/);
    if (!match) throw new ApiError("Enter a valid host and port.", 400);
    return { host: match[1], port: parsePort(match[2] || String(defaultPort), Boolean(defaultPort)) };
  }

  const colonCount = (raw.match(/:/g) || []).length;

  if (colonCount === 1) {
    const [host, port] = raw.split(":");
    return { host, port: parsePort(port || String(defaultPort), Boolean(defaultPort)) };
  }

  if (colonCount > 1) {
    return { host: raw, port: parsePort(String(defaultPort), Boolean(defaultPort)) };
  }

  return { host: raw, port: parsePort(String(defaultPort), Boolean(defaultPort)) };
}

function parsePort(value: string | undefined, hasDefault: boolean) {
  if (!value && !hasDefault) throw new ApiError("Include a port number from 1 to 65535.", 400);
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ApiError("Port must be a number from 1 to 65535.", 400);
  }
  return port;
}

async function resolvePublicHost(hostname: string) {
  const ipVersion = net.isIP(hostname);

  if (ipVersion) {
    if (!isPublicIp(hostname)) throw new ApiError("Private, local, reserved, and multicast IPs are not allowed.", 400);
    return [{ address: hostname, family: ipVersion }] satisfies LookupAddress[];
  }

  let addresses: LookupAddress[];

  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: false });
  } catch {
    throw new ApiError("Hostname could not be resolved.", 400);
  }

  if (!addresses.length) throw new ApiError("Hostname did not resolve to any addresses.", 400);

  const blocked = addresses.find((address) => !isPublicIp(address.address));
  if (blocked) throw new ApiError("Resolved address is private, local, reserved, or multicast.", 400);

  return addresses;
}

function requirePublicIp(input: string) {
  const raw = normalizeIpLiteral(requireInput(input, "Enter a public IP address."));

  if (!net.isIP(raw)) throw new ApiError("Enter a valid public IP address.", 400);
  if (!isPublicIp(raw)) throw new ApiError("Private, local, reserved, and multicast IPs are not allowed.", 400);

  return raw;
}

function safeFetch(url: URL, init: RequestInit) {
  return fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "*/*",
      "User-Agent": USER_AGENT,
      ...(init.headers ?? {})
    }
  }).catch((error: unknown) => {
    throw fetchErrorToApiError(error);
  });
}

async function fetchJson(url: string, cacheKey: string, ttlMs: number) {
  return withCache(cacheKey, ttlMs, async () => {
    const response = await fetch(url, {
      headers: { Accept: "application/rdap+json, application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    }).catch((error: unknown) => {
      throw fetchErrorToApiError(error);
    });

    if (!response.ok) throw new ApiError(`Lookup provider returned HTTP ${response.status}.`, 502);

    return response.json() as Promise<JsonRecord>;
  });
}

async function readLimitedText(response: Response, limit: number) {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < limit) {
    const { value, done } = await reader.read();
    if (done || !value) break;
    const slice = value.slice(0, Math.max(0, limit - total));
    chunks.push(slice);
    total += slice.byteLength;
  }

  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function readCertificate(address: string, hostname: string, port: number) {
  return new Promise<{
    authorized: boolean;
    authorizationError: string | null;
    protocol: string | null;
    cipher: JsonRecord;
    peerCertificate: JsonRecord;
  }>((resolve, reject) => {
    const socket = tls.connect({
      host: address,
      port,
      servername: net.isIP(hostname) ? undefined : hostname,
      rejectUnauthorized: false,
      timeout: TCP_TIMEOUT_MS
    });

    socket.once("secureConnect", () => {
      const cert = socket.getPeerCertificate();
      const cipher = socket.getCipher();

      resolve({
        authorized: socket.authorized,
        authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
        protocol: socket.getProtocol(),
        cipher: { name: cipher.name, standardName: cipher.standardName, version: cipher.version },
        peerCertificate: {
          subject: cert.subject,
          issuer: cert.issuer,
          subjectaltname: cert.subjectaltname,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          fingerprint256: cert.fingerprint256,
          serialNumber: cert.serialNumber
        }
      });
      socket.end();
    });

    socket.once("timeout", () => {
      socket.destroy();
      reject(new ApiError("TLS connection timed out.", 504));
    });
    socket.once("error", (error) => reject(new ApiError(error.message, 502)));
  });
}

function connectTcp(address: string, port: number) {
  return new Promise<{ reachable: boolean; error?: string }>((resolve) => {
    const socket = net.createConnection({ host: address, port, timeout: TCP_TIMEOUT_MS });

    socket.once("connect", () => {
      socket.end();
      resolve({ reachable: true });
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve({ reachable: false, error: "Connection timed out." });
    });
    socket.once("error", (error) => resolve({ reachable: false, error: error.message }));
  });
}

function headersToObject(headers: Headers) {
  return Object.fromEntries(Array.from(headers.entries()).slice(0, 100));
}

function isRedirectStatus(status: number) {
  return [301, 302, 303, 307, 308].includes(status);
}

function summarizeRdap(target: string, data: JsonRecord) {
  return {
    target,
    handle: stringField(data.handle),
    name: stringField(data.name),
    type: stringField(data.type),
    country: stringField(data.country),
    startAddress: stringField(data.startAddress),
    endAddress: stringField(data.endAddress),
    registrar: findEntityName(data.entities),
    nameservers: Array.isArray(data.nameservers)
      ? data.nameservers.map((item) => (isRecord(item) ? stringField(item.ldhName) : null)).filter(Boolean)
      : [],
    events: Array.isArray(data.events)
      ? data.events.map((item) => (isRecord(item) ? { action: item.eventAction, date: item.eventDate } : null)).filter(Boolean).slice(0, 12)
      : [],
    links: Array.isArray(data.links)
      ? data.links.map((item) => (isRecord(item) ? item.href : null)).filter(Boolean).slice(0, 8)
      : []
  };
}

function findEntityName(value: unknown) {
  if (!Array.isArray(value)) return null;

  for (const entity of value) {
    if (!isRecord(entity) || !Array.isArray(entity.vcardArray)) continue;
    const cards = entity.vcardArray[1];
    if (!Array.isArray(cards)) continue;
    const fn = cards.find((card) => Array.isArray(card) && card[0] === "fn");
    if (Array.isArray(fn) && typeof fn[3] === "string") return fn[3];
  }

  return null;
}

function toCymruOriginQuery(ip: string) {
  if (net.isIPv4(ip)) return `${ip.split(".").reverse().join(".")}.origin.asn.cymru.com`;

  const expanded = expandIpv6(ip);
  return `${expanded.replace(/:/g, "").split("").reverse().join(".")}.origin6.asn.cymru.com`;
}

function expandIpv6(ip: string) {
  const [head, tail = ""] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = 8 - headParts.length - tailParts.length;
  const parts = [...headParts, ...Array(Math.max(0, missing)).fill("0"), ...tailParts];

  return parts.map((part) => part.padStart(4, "0")).join(":");
}

function parseCymruRow(row: string) {
  const [asn, second, third, fourth, fifth, sixth] = row.split("|").map((part) => part.trim());

  if (second?.includes("/")) {
    return { asn, prefix: second, country: third, registry: fourth, allocated: fifth, name: sixth || null };
  }

  return { asn, country: second, registry: third, allocated: fourth, name: fifth };
}

function dnsErrorMessage(error: unknown) {
  if (isRecord(error) && typeof error.code === "string") return error.code;
  return error instanceof Error ? error.message : "Lookup failed";
}

function fetchErrorToApiError(error: unknown) {
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return new ApiError("Network request timed out.", 504);
  }

  return new ApiError(error instanceof Error ? error.message : "Network request failed.", 502);
}

function stringField(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
