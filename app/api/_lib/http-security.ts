import type { DiagnosticCheck, HttpSecurityResult } from "./diagnostic-types";
import { summarizeChecks } from "./diagnostic-types";

type SafeFetch = (url: URL, init: RequestInit, headersOnly?: boolean) => Promise<Response>;
type NormalizeUrl = (input: string) => URL;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;

export async function inspectHttpSecurity(
  input: string,
  safeFetch: SafeFetch,
  normalizeUrl: NormalizeUrl
): Promise<HttpSecurityResult> {
  const requestedUrl = normalizeUrl(input);
  let currentUrl = requestedUrl;
  let redirectCount = 0;
  let response: Response;

  while (true) {
    response = await requestHeadersOnly(currentUrl, safeFetch);
    const location = response.headers.get("location");

    if (!REDIRECT_STATUSES.has(response.status) || !location) break;
    if (redirectCount >= MAX_REDIRECTS) throw new Error("Redirect limit exceeded (maximum 5)." );

    currentUrl = normalizeUrl(new URL(location, currentUrl).href);
    redirectCount += 1;
  }

  const headers = Object.fromEntries(Array.from(response.headers.entries()).slice(0, 100));
  const checks = evaluateSecurityHeaders(currentUrl, headers);

  return {
    requestedUrl: requestedUrl.href,
    finalUrl: currentUrl.href,
    statusCode: response.status,
    redirectCount,
    summary: summarizeChecks(checks),
    checks,
    headers
  };
}

async function requestHeadersOnly(url: URL, safeFetch: SafeFetch) {
  let response = await safeFetch(url, { method: "HEAD" });
  if (response.status === 405 || response.status === 501) {
    response = await safeFetch(url, { method: "GET", headers: { Range: "bytes=0-0" } }, true);
  }
  return response;
}

export function evaluateSecurityHeaders(finalUrl: URL, headers: Record<string, string>): DiagnosticCheck[] {
  const normalized = Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value.trim()]));
  const get = (name: string) => normalized[name.toLowerCase()] || "";
  const csp = get("content-security-policy");
  const frameAncestors = /(?:^|;)\s*frame-ancestors\s+[^;]+/i.test(csp);
  const xFrameOptions = /^(deny|sameorigin)$/i.test(get("x-frame-options"));

  return [
    check(
      "https",
      "HTTPS transport",
      finalUrl.protocol === "https:" ? "pass" : "fail",
      finalUrl.protocol === "https:" ? "The final response uses HTTPS." : "The final response uses unencrypted HTTP.",
      finalUrl.protocol,
      "Serve the final destination over HTTPS."
    ),
    presenceCheck("hsts", "Strict-Transport-Security", get("strict-transport-security"), finalUrl.protocol === "https:" ? "fail" : "warning", "Send HSTS over HTTPS with an appropriate max-age."),
    presenceCheck("csp", "Content-Security-Policy", csp, "fail", "Define a site-specific Content-Security-Policy."),
    check(
      "clickjacking",
      "Clickjacking protection",
      frameAncestors || xFrameOptions ? "pass" : "fail",
      frameAncestors ? "CSP frame-ancestors controls embedding." : xFrameOptions ? "X-Frame-Options controls embedding." : "No frame-ancestors directive or valid X-Frame-Options value was observed.",
      frameAncestors ? "CSP frame-ancestors" : get("x-frame-options") || "Not set",
      "Prefer CSP frame-ancestors; X-Frame-Options is a compatible fallback."
    ),
    check(
      "nosniff",
      "X-Content-Type-Options",
      get("x-content-type-options").toLowerCase() === "nosniff" ? "pass" : "fail",
      get("x-content-type-options").toLowerCase() === "nosniff" ? "MIME sniffing is disabled." : "The nosniff directive is missing or invalid.",
      get("x-content-type-options") || "Not set",
      "Set X-Content-Type-Options: nosniff."
    ),
    presenceCheck("referrer-policy", "Referrer-Policy", get("referrer-policy"), "warning", "Set a privacy-appropriate Referrer-Policy."),
    presenceCheck("permissions-policy", "Permissions-Policy", get("permissions-policy"), "warning", "Disable browser capabilities the site does not need."),
    presenceCheck("coop", "Cross-Origin-Opener-Policy", get("cross-origin-opener-policy"), "warning", "Consider same-origin where cross-origin window isolation is appropriate."),
    presenceCheck("corp", "Cross-Origin-Resource-Policy", get("cross-origin-resource-policy"), "warning", "Set an appropriate cross-origin resource policy for served assets."),
    get("cross-origin-embedder-policy")
      ? check("coep", "Cross-Origin-Embedder-Policy", "info", "COEP is present; verify that cross-origin isolation is intentional.", get("cross-origin-embedder-policy"), "COEP is optional and can break third-party embeds.")
      : check("coep", "Cross-Origin-Embedder-Policy", "info", "COEP is optional and is not set.", "Not set", "Only enable COEP when the site requires cross-origin isolation.")
  ];
}

function presenceCheck(id: string, label: string, value: string, missingStatus: "warning" | "fail", recommendation: string): DiagnosticCheck {
  return check(
    id,
    label,
    value ? "pass" : missingStatus,
    value ? `${label} is present.` : `${label} was not observed.`,
    value || "Not set",
    recommendation
  );
}

function check(
  id: string,
  label: string,
  status: DiagnosticCheck["status"],
  summary: string,
  observedValue: string,
  recommendation: string
): DiagnosticCheck {
  return { id, label, status, summary, observedValue, recommendation };
}
