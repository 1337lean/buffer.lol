export const DNS_RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA"] as const;

export type DnsRecordType = (typeof DNS_RECORD_TYPES)[number];

export type ToolRequest = {
  input: string;
  options?: {
    recordType?: DnsRecordType;
    dkimSelector?: string;
  };
};

export type DiagnosticStatus = "pass" | "warning" | "fail" | "info" | "error";

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  summary: string;
  records?: string[];
  observedValue?: string;
  recommendation?: string;
};

export type EmailDnsHealthResult = {
  domain: string;
  summary: Record<DiagnosticStatus, number>;
  checks: DiagnosticCheck[];
};

export type ResolverStatus = "match" | "different" | "no-answer" | "error";

export type ResolverComparisonResult = {
  domain: string;
  recordType: DnsRecordType;
  summary: {
    allSuccessfulAnswersAgree: boolean;
    uniqueAnswerSets: number;
    successfulResolvers: number;
    totalResolvers: number;
  };
  resolvers: Array<{
    id: string;
    name: string;
    address: string;
    latencyMs: number;
    status: ResolverStatus;
    answers: string[];
    error?: string;
  }>;
};

export type HttpSecurityResult = {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  redirectCount: number;
  summary: Record<DiagnosticStatus, number>;
  checks: DiagnosticCheck[];
  headers: Record<string, string>;
};

export function emptyDiagnosticSummary(): Record<DiagnosticStatus, number> {
  return { pass: 0, warning: 0, fail: 0, info: 0, error: 0 };
}

export function summarizeChecks(checks: DiagnosticCheck[]) {
  const summary = emptyDiagnosticSummary();
  for (const check of checks) summary[check.status] += 1;
  return summary;
}
