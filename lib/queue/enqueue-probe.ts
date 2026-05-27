import { processProbe } from "@/workers/probe-worker";
import { logError, logInfo } from "@/lib/observability/log";

export async function enqueueProbe(probeId: string) {
  const provider = process.env.QUEUE_PROVIDER || "inline";

  if (provider === "inline" || provider === "stub") {
    if (process.env.NODE_ENV === "production") {
      logInfo("inline probe processing disabled in production", { probeId, provider });
      return { provider, enqueued: false, processedInline: false };
    }

    logInfo("processing probe inline", { probeId, provider });
    try {
      await processProbe(probeId);
      return { provider, enqueued: true, processedInline: true };
    } catch (error) {
      logError("inline probe processing failed after enqueue", error, { probeId, provider });
      return { provider, enqueued: true, processedInline: false };
    }
  }

  if (provider === "database") {
    logInfo("probe stored for database-backed worker", { provider, probeId });
    return { provider, enqueued: true, processedInline: false };
  }

  if (provider === "qstash") {
    return enqueueQstashProbe(probeId, provider);
  }

  if (provider === "webhook") {
    const webhookUrl = process.env.QUEUE_WEBHOOK_URL;
    if (!webhookUrl) {
      logInfo("probe queue webhook missing URL", { provider, probeId });
      return { provider, enqueued: false, processedInline: false };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.WORKER_SECRET ? { authorization: `Bearer ${process.env.WORKER_SECRET}` } : {})
      },
      body: JSON.stringify({ probeId })
    });

    logInfo("probe submitted to webhook queue", { provider, probeId, status: response.status });
    return { provider, enqueued: response.ok, processedInline: false };
  }

  logInfo("probe queue provider not implemented yet", { provider, probeId });
  return { provider, enqueued: false, processedInline: false };
}

async function enqueueQstashProbe(probeId: string, provider: string) {
  const publishUrl = getQstashPublishUrl();
  if (!publishUrl) {
    logInfo("qstash queue missing publish URL or destination", { provider, probeId });
    return { provider, enqueued: false, processedInline: false };
  }

  const token = process.env.QSTASH_TOKEN;
  if (!token && !process.env.QSTASH_PUBLISH_URL) {
    logInfo("qstash queue missing token", { provider, probeId });
    return { provider, enqueued: false, processedInline: false };
  }

  const response = await fetch(publishUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(process.env.WORKER_SECRET ? { "Upstash-Forward-Authorization": `Bearer ${process.env.WORKER_SECRET}` } : {})
    },
    body: JSON.stringify({ probeId })
  });

  logInfo("probe submitted to qstash", { provider, probeId, status: response.status });
  return { provider, enqueued: response.ok, processedInline: false };
}

function getQstashPublishUrl() {
  if (process.env.QSTASH_PUBLISH_URL) return process.env.QSTASH_PUBLISH_URL;

  const workerUrl = process.env.QUEUE_WEBHOOK_URL || buildWorkerUrl();
  if (!workerUrl) return null;

  const qstashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";
  return `${qstashUrl.replace(/\/$/, "")}/v2/publish/${workerUrl}`;
}

function buildWorkerUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.URL;
  if (!appUrl) return null;
  return new URL("/api/workers/probes", appUrl).toString();
}
