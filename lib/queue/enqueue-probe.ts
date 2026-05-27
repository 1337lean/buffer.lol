import { processProbe } from "@/workers/probe-worker";
import { logInfo } from "@/lib/observability/log";

export async function enqueueProbe(probeId: string) {
  const provider = process.env.QUEUE_PROVIDER || "inline";

  if (provider === "inline" || provider === "stub") {
    if (process.env.NODE_ENV === "production") {
      logInfo("inline probe processing disabled in production", { probeId, provider });
      return { provider, enqueued: false, processedInline: false };
    }

    logInfo("processing probe inline", { probeId, provider });
    await processProbe(probeId);
    return { provider, enqueued: true, processedInline: true };
  }

  if (provider === "database") {
    logInfo("probe stored for database-backed worker", { provider, probeId });
    return { provider, enqueued: true, processedInline: false };
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
