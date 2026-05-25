import { logInfo } from "@/lib/observability/log";

export function trackServerEvent(event: string, properties: Record<string, unknown> = {}) {
  if (!process.env.POSTHOG_KEY) {
    logInfo("analytics event", { event, properties, provider: "stub" });
    return;
  }

  logInfo("analytics event queued", { event, properties, provider: "posthog" });
}
