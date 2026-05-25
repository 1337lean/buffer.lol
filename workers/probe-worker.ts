import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { probeEvents, probeMetrics, probes, reports, users } from "@/lib/db/schema";
import { logError, logInfo } from "@/lib/observability/log";
import { validateProbeUrl } from "@/lib/probes/validate-url";
import { sendProbeCompletedEmail } from "@/lib/notifications/email";
import { trackServerEvent } from "@/lib/analytics/events";

const MANIFEST_TIMEOUT_MS = 8000;
const SEGMENT_TIMEOUT_MS = 7000;
const MAX_SAMPLE_SEGMENTS = 3;

type HeaderMap = Record<string, string | null>;

type FetchResult = {
  url: string;
  status: number;
  ok: boolean;
  ms: number;
  text: string;
  bytes: number;
  headers: HeaderMap;
};

type Check = {
  status: "pass" | "warn" | "fail";
  label: string;
  detail: string;
};

export async function processProbe(probeId: string) {
  const db = getDb();
  const [probe] = await db.select().from(probes).where(eq(probes.id, probeId)).limit(1);
  if (!probe) throw new Error(`Probe ${probeId} not found.`);

  await addEvent(probe.id, "system", "Worker claimed probe.");
  await db.update(probes).set({ status: "running", startedAt: new Date(), summary: "Diagnostics running." }).where(eq(probes.id, probe.id));

  try {
    await validateProbeUrl(probe.url);
    const manifest = await fetchText(probe.url, MANIFEST_TIMEOUT_MS);
    await addEvent(probe.id, manifest.ok ? "pass" : "fail", `Manifest responded with HTTP ${manifest.status} in ${manifest.ms}ms.`, manifest.headers);

    if (!manifest.ok) {
      await finishWithError(probe.id, `Manifest returned HTTP ${manifest.status}.`);
      return;
    }

    const result = probe.probeType === "dash"
      ? await inspectDash(probe.id, manifest)
      : await inspectHls(probe.id, manifest);

    await db.insert(probeMetrics).values({
      probeId: probe.id,
      manifestFetchMs: manifest.ms,
      firstSegmentFetchMs: result.firstSegmentFetchMs,
      cdnResponseMs: result.cdnResponseMs,
      liveLatencyMs: result.liveLatencyMs,
      rebufferCount: result.rebufferCount,
      bitrateVariantCount: result.variantCount,
      segmentCountSampled: result.segmentCount,
      metadata: {
        manifest: {
          url: manifest.url,
          bytes: manifest.bytes,
          headers: manifest.headers
        },
        samples: result.samples
      }
    });

    const status = classify(result.checks);
    const title = titleForStatus(status, result.checks);
    const actions = actionsForStatus(status);
    const reportText = buildReportText({ status, title, probeType: probe.probeType, url: probe.url, checks: result.checks, actions });

    await db.insert(reports).values({
      probeId: probe.id,
      status,
      title,
      checks: result.checks,
      recommendedActions: actions,
      reportText
    });

    await db.update(probes).set({ status, summary: title, completedAt: new Date() }).where(eq(probes.id, probe.id));
    await addEvent(probe.id, status === "pass" ? "pass" : status, `Report generated: ${title}`);

    const [creator] = await db.select({ email: users.email }).from(users).where(eq(users.id, probe.createdBy)).limit(1);
    if (creator) await sendProbeCompletedEmail({ email: creator.email, probeId: probe.id, status, title });
    trackServerEvent("probe_completed", { probeId: probe.id, status, probeType: probe.probeType });
    logInfo("probe completed", { probeId: probe.id, status });
  } catch (error) {
    logError("probe failed", error, { probeId: probe.id });
    await finishWithError(probe.id, error instanceof Error ? error.message : "Probe failed unexpectedly.");
  }
}

async function inspectHls(probeId: string, manifest: FetchResult) {
  const variants = parseHlsVariants(manifest.text, manifest.url);
  const playlistUrl = variants[0]?.url || manifest.url;
  const mediaPlaylist = playlistUrl === manifest.url ? manifest : await fetchText(playlistUrl, MANIFEST_TIMEOUT_MS);
  if (playlistUrl !== manifest.url) {
    await addEvent(probeId, mediaPlaylist.ok ? "pass" : "warn", `Media playlist fetched in ${mediaPlaylist.ms}ms.`);
  }

  const segments = parseHlsSegments(mediaPlaylist.text, mediaPlaylist.url).slice(0, MAX_SAMPLE_SEGMENTS);
  const samples = await sampleUrls(probeId, segments);
  const targetDuration = parseNumberTag(mediaPlaylist.text, "#EXT-X-TARGETDURATION");
  const mediaSequence = parseNumberTag(mediaPlaylist.text, "#EXT-X-MEDIA-SEQUENCE");
  const isLive = !mediaPlaylist.text.includes("#EXT-X-ENDLIST");
  const liveLatencyMs = isLive && targetDuration ? targetDuration * 3 * 1000 : null;
  const checks: Check[] = [
    variants.length > 0
      ? { status: "pass", label: "Variant ladder", detail: `${variants.length} bitrate variants detected.` }
      : { status: "warn", label: "Variant ladder", detail: "No master playlist variants detected." },
    segments.length > 0
      ? { status: "pass", label: "Segments", detail: `${segments.length} segment URL samples discovered.` }
      : { status: "fail", label: "Segments", detail: "No segment URLs were found in the sampled playlist." },
    manifest.ms <= 1200
      ? { status: "pass", label: "Manifest timing", detail: `Manifest fetched in ${manifest.ms}ms.` }
      : { status: "warn", label: "Manifest timing", detail: `Manifest fetch took ${manifest.ms}ms.` },
    ...segmentChecks(samples)
  ];

  if (isLive && mediaSequence === null) {
    checks.push({ status: "warn", label: "Live freshness", detail: "Live playlist does not expose a media sequence." });
  }

  return {
    checks,
    samples,
    variantCount: Math.max(variants.length, 1),
    segmentCount: samples.length,
    firstSegmentFetchMs: samples[0]?.ms ?? null,
    cdnResponseMs: samples[0]?.ms ?? manifest.ms,
    liveLatencyMs,
    rebufferCount: samples.filter((sample) => sample.status >= 400 || sample.ms > 2500).length
  };
}

async function inspectDash(probeId: string, manifest: FetchResult) {
  const representationCount = countMatches(manifest.text, /<Representation\b/g);
  const adaptationSetCount = countMatches(manifest.text, /<AdaptationSet\b/g);
  const samples = await sampleUrls(probeId, parseDashSampleUrls(manifest.text, manifest.url).slice(0, MAX_SAMPLE_SEGMENTS));
  const checks: Check[] = [
    representationCount > 0
      ? { status: "pass", label: "Representations", detail: `${representationCount} DASH representations detected.` }
      : { status: "fail", label: "Representations", detail: "No DASH representations were detected." },
    adaptationSetCount > 0
      ? { status: "pass", label: "Adaptation sets", detail: `${adaptationSetCount} adaptation sets detected.` }
      : { status: "warn", label: "Adaptation sets", detail: "No adaptation sets were detected." },
    manifest.ms <= 1200
      ? { status: "pass", label: "MPD timing", detail: `MPD fetched in ${manifest.ms}ms.` }
      : { status: "warn", label: "MPD timing", detail: `MPD fetch took ${manifest.ms}ms.` },
    ...segmentChecks(samples)
  ];

  return {
    checks,
    samples,
    variantCount: representationCount,
    segmentCount: samples.length,
    firstSegmentFetchMs: samples[0]?.ms ?? null,
    cdnResponseMs: samples[0]?.ms ?? manifest.ms,
    liveLatencyMs: null,
    rebufferCount: samples.filter((sample) => sample.status >= 400 || sample.ms > 2500).length
  };
}

async function fetchText(url: string, timeoutMs: number): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "buffer.lol diagnostics/1.0",
        accept: "application/vnd.apple.mpegurl, application/dash+xml, text/plain, */*"
      }
    });
    const text = await response.text();
    return {
      url: response.url,
      status: response.status,
      ok: response.ok,
      ms: Math.round(performance.now() - started),
      text,
      bytes: new TextEncoder().encode(text).length,
      headers: pickHeaders(response.headers)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSample(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEGMENT_TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "buffer.lol diagnostics/1.0",
        range: "bytes=0-65535"
      }
    });
    await response.arrayBuffer();
    return {
      url: response.url,
      status: response.status,
      ok: response.ok || response.status === 206,
      ms: Math.round(performance.now() - started),
      headers: pickHeaders(response.headers)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sampleUrls(probeId: string, urls: string[]) {
  const samples = [];
  for (const url of urls) {
    try {
      const sample = await fetchSample(url);
      samples.push(sample);
      await addEvent(probeId, sample.ok ? "pass" : "warn", `Sample fetched with HTTP ${sample.status} in ${sample.ms}ms.`);
    } catch (error) {
      samples.push({ url, status: 0, ok: false, ms: SEGMENT_TIMEOUT_MS, headers: {}, error: error instanceof Error ? error.message : "Sample failed" });
      await addEvent(probeId, "warn", `Sample fetch failed for ${url}.`);
    }
  }
  return samples;
}

function parseHlsVariants(text: string, baseUrl: string) {
  const lines = text.split(/\r?\n/);
  const variants: Array<{ url: string; bandwidth: number | null }> = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith("#EXT-X-STREAM-INF")) continue;
    const next = lines.slice(index + 1).find((line) => line.trim() && !line.startsWith("#"));
    if (next) variants.push({ url: new URL(next.trim(), baseUrl).toString(), bandwidth: parseAttributeNumber(lines[index], "BANDWIDTH") });
  }
  return variants;
}

function parseHlsSegments(text: string, baseUrl: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => new URL(line, baseUrl).toString());
}

function parseDashSampleUrls(text: string, baseUrl: string) {
  const urls = new Set<string>();
  for (const regex of [
    /<BaseURL>([^<]+)<\/BaseURL>/g,
    /(?:media|initialization)="([^"]+)"/g,
    /<SegmentURL[^>]+media="([^"]+)"/g
  ]) {
    for (const match of text.matchAll(regex)) {
      const candidate = match[1];
      if (!candidate || candidate.includes("$")) continue;
      urls.add(new URL(candidate, baseUrl).toString());
    }
  }
  return Array.from(urls);
}

function parseAttributeNumber(line: string, key: string) {
  const match = line.match(new RegExp(`${key}=([0-9]+)`));
  return match ? Number(match[1]) : null;
}

function parseNumberTag(text: string, tag: string) {
  const line = text.split(/\r?\n/).find((item) => item.startsWith(tag));
  if (!line) return null;
  const value = Number(line.split(":")[1]);
  return Number.isFinite(value) ? value : null;
}

function countMatches(text: string, regex: RegExp) {
  return Array.from(text.matchAll(regex)).length;
}

function segmentChecks(samples: Array<{ ok: boolean; status: number; ms: number }>): Check[] {
  if (!samples.length) return [{ status: "warn", label: "Sample fetch", detail: "No segment samples were fetched." }];
  const slowest = Math.max(...samples.map((sample) => sample.ms));
  const failed = samples.filter((sample) => !sample.ok).length;
  if (failed) return [{ status: "fail", label: "Sample fetch", detail: `${failed} sampled media requests failed.` }];
  if (slowest > 2500) return [{ status: "warn", label: "Sample timing", detail: `Slowest media sample took ${slowest}ms.` }];
  return [{ status: "pass", label: "Sample timing", detail: `All sampled media requests completed; slowest was ${slowest}ms.` }];
}

function classify(checks: Check[]) {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warn")) return "warn";
  return "pass";
}

function titleForStatus(status: "pass" | "warn" | "fail", checks: Check[]) {
  if (status === "pass") return "No major delivery risk detected";
  const firstIssue = checks.find((check) => check.status === status);
  return firstIssue ? firstIssue.detail : "Diagnostics completed with findings";
}

function actionsForStatus(status: "pass" | "warn" | "fail") {
  if (status === "pass") return ["Keep this URL in baseline monitoring.", "Re-run before major events or releases."];
  if (status === "warn") return ["Re-run from another region.", "Inspect cache headers, manifest freshness, and slow media samples."];
  return ["Treat this URL as unsafe for launch.", "Verify origin availability, playlist correctness, and media segment access."];
}

function buildReportText(input: {
  status: string;
  title: string;
  probeType: string;
  url: string;
  checks: Check[];
  actions: string[];
}) {
  return [
    `buffer.lol report (${input.status.toUpperCase()})`,
    `${input.probeType.toUpperCase()} URL: ${input.url}`,
    `Finding: ${input.title}`,
    "Checks:",
    ...input.checks.map((check) => `- ${check.status.toUpperCase()} ${check.label}: ${check.detail}`),
    "Recommended actions:",
    ...input.actions.map((action) => `- ${action}`)
  ].join("\n");
}

function pickHeaders(headers: Headers): HeaderMap {
  return {
    "content-type": headers.get("content-type"),
    "content-length": headers.get("content-length"),
    "cache-control": headers.get("cache-control"),
    age: headers.get("age"),
    via: headers.get("via"),
    server: headers.get("server"),
    "x-cache": headers.get("x-cache"),
    "cf-cache-status": headers.get("cf-cache-status")
  };
}

async function addEvent(probeId: string, level: "system" | "pass" | "warn" | "fail" | "error", message: string, metadata: Record<string, unknown> = {}) {
  const db = getDb();
  await db.insert(probeEvents).values({ probeId, level, message, metadata });
}

async function finishWithError(probeId: string, message: string) {
  const db = getDb();
  await addEvent(probeId, "error", message);
  await db.insert(reports).values({
    probeId,
    status: "error",
    title: "Probe failed before diagnostics completed",
    checks: [{ status: "fail", label: "Worker execution", detail: message }],
    recommendedActions: ["Confirm the URL is publicly reachable.", "Retry after checking origin and CDN access."],
    reportText: `buffer.lol report (ERROR)\n${message}`
  });
  await db.update(probes).set({ status: "error", summary: message, completedAt: new Date() }).where(eq(probes.id, probeId));
}
