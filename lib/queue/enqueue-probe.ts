import { processProbe } from "@/workers/probe-worker";
import { logInfo } from "@/lib/observability/log";

export async function enqueueProbe(probeId: string) {
  const provider = process.env.QUEUE_PROVIDER || "inline";

  if (provider === "inline" || provider === "stub") {
    logInfo("processing probe inline", { probeId, provider });
    await processProbe(probeId);
    return { provider, enqueued: true, processedInline: true };
  }

  logInfo("probe queue provider not implemented yet", { provider, probeId });
  return { provider, enqueued: false };
}
