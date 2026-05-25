import { logInfo } from "@/lib/observability/log";

export async function sendProbeCompletedEmail(input: {
  email: string;
  probeId: string;
  status: string;
  title: string;
}) {
  if (!process.env.EMAIL_PROVIDER) {
    logInfo("email notification skipped", { provider: "stub", ...input });
    return;
  }

  logInfo("email notification queued", { provider: process.env.EMAIL_PROVIDER, ...input });
}
