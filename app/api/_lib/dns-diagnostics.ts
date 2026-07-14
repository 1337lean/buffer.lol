import { Resolver } from "node:dns/promises";
import { withCache } from "./request-cache";
import type {
  DiagnosticCheck,
  DnsRecordType,
  EmailDnsHealthResult,
  ResolverComparisonResult
} from "./diagnostic-types";
import { summarizeChecks } from "./diagnostic-types";

export const PUBLIC_RESOLVERS = [
  { id: "cloudflare", name: "Cloudflare", address: "1.1.1.1" },
  { id: "google", name: "Google", address: "8.8.8.8" },
  { id: "quad9", name: "Quad9", address: "9.9.9.9" },
  { id: "opendns", name: "OpenDNS", address: "208.67.222.222" }
] as const;

const RESOLVER_CACHE_TTL_MS = 30_000;
const NO_ANSWER_CODES = new Set(["ENODATA", "ENOTFOUND", "ENOENT"]);

type QueryOutcome = { answers: string[]; latencyMs: number; error?: string; noAnswer?: boolean };
type TxtOutcome = { records: string[]; error?: string; noAnswer?: boolean };

export type ResolverQuery = (
  resolver: (typeof PUBLIC_RESOLVERS)[number],
  domain: string,
  recordType: DnsRecordType
) => Promise<QueryOutcome>;

export async function compareDnsResolvers(
  domain: string,
  recordType: DnsRecordType,
  query: ResolverQuery = queryPublicResolver
): Promise<ResolverComparisonResult> {
  return withCache(`resolver-comparison:${domain}:${recordType}`, RESOLVER_CACHE_TTL_MS, async () => {
    const outcomes = await Promise.all(PUBLIC_RESOLVERS.map(async (resolver) => {
      try {
        return { resolver, ...(await query(resolver, domain, recordType)) };
      } catch (error) {
        return {
          resolver,
          answers: [],
          latencyMs: 3_000,
          error: dnsErrorMessage(error)
        };
      }
    }));

    const successful = outcomes.filter((outcome) => !outcome.error && !outcome.noAnswer && outcome.answers.length > 0);
    const answerSetCounts = new Map<string, number>();

    for (const outcome of successful) {
      const key = normalizeResolverAnswers(outcome.answers).join("\n");
      answerSetCounts.set(key, (answerSetCounts.get(key) ?? 0) + 1);
    }

    const consensusKey = Array.from(answerSetCounts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];

    return {
      domain,
      recordType,
      summary: {
        allSuccessfulAnswersAgree: successful.length > 0 && answerSetCounts.size <= 1,
        uniqueAnswerSets: answerSetCounts.size,
        successfulResolvers: successful.length,
        totalResolvers: PUBLIC_RESOLVERS.length
      },
      resolvers: outcomes.map((outcome) => {
        const answers = normalizeResolverAnswers(outcome.answers);
        const answerKey = answers.join("\n");
        const status = outcome.error
          ? "error" as const
          : outcome.noAnswer || answers.length === 0
            ? "no-answer" as const
            : answerKey === consensusKey
              ? "match" as const
              : "different" as const;

        return {
          ...outcome.resolver,
          latencyMs: Math.round(outcome.latencyMs),
          status,
          answers,
          ...(outcome.error ? { error: outcome.error } : {})
        };
      })
    };
  });
}

async function queryPublicResolver(
  resolverDefinition: (typeof PUBLIC_RESOLVERS)[number],
  domain: string,
  recordType: DnsRecordType
): Promise<QueryOutcome> {
  const resolver = new Resolver({ timeout: 3_000, tries: 1 });
  resolver.setServers([resolverDefinition.address]);
  const started = performance.now();

  try {
    const records = await resolveByType(resolver, domain, recordType);
    return { answers: normalizeDnsRecords(recordType, records), latencyMs: performance.now() - started };
  } catch (error) {
    const code = dnsErrorCode(error);
    return {
      answers: [],
      latencyMs: performance.now() - started,
      ...(NO_ANSWER_CODES.has(code) ? { noAnswer: true } : { error: dnsErrorMessage(error) })
    };
  }
}

async function resolveByType(resolver: Resolver, domain: string, recordType: DnsRecordType): Promise<unknown[]> {
  switch (recordType) {
    case "A": return resolver.resolve4(domain);
    case "AAAA": return resolver.resolve6(domain);
    case "CNAME": return resolver.resolveCname(domain);
    case "MX": return resolver.resolveMx(domain);
    case "NS": return resolver.resolveNs(domain);
    case "TXT": return resolver.resolveTxt(domain);
    case "CAA": return resolver.resolveCaa(domain);
  }
}

export function normalizeDnsRecords(recordType: DnsRecordType, records: unknown[]): string[] {
  return normalizeResolverAnswers(records.flatMap((record) => {
    if (typeof record === "string") {
      return [recordType === "CNAME" || recordType === "NS" ? record.toLowerCase().replace(/\.$/, "") : record];
    }
    if (Array.isArray(record)) return [record.map(String).join("")];
    if (!isRecord(record)) return [];

    if (recordType === "MX" && typeof record.exchange === "string") {
      return [`${Number(record.priority) || 0} ${record.exchange.toLowerCase().replace(/\.$/, "")}`];
    }

    if (recordType === "CAA") {
      const tag = ["issue", "issuewild", "iodef", "tag"].find((key) => typeof record[key] === "string");
      const value = tag ? record[tag] : record.value;
      if (tag && typeof value === "string") return [`${Number(record.critical) || 0} ${tag} ${value}`];
    }

    return [stableStringify(record)];
  }));
}

export function normalizeResolverAnswers(answers: string[]): string[] {
  return Array.from(new Set(answers.map((answer) => answer.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

export async function checkEmailDnsHealth(
  domain: string,
  dkimSelector?: string,
  queryTxt: (name: string) => Promise<TxtOutcome> = querySystemTxt,
  queryMx: (name: string) => Promise<TxtOutcome> = querySystemMx
): Promise<EmailDnsHealthResult> {
  const [mx, spf, dmarc, dkim, mtaSts, tlsReporting] = await Promise.all([
    queryMx(domain),
    queryTxt(domain),
    queryTxt(`_dmarc.${domain}`),
    dkimSelector ? queryTxt(`${dkimSelector}._domainkey.${domain}`) : Promise.resolve({ records: [] }),
    queryTxt(`_mta-sts.${domain}`),
    queryTxt(`_smtp._tls.${domain}`)
  ]);

  const checks = [
    evaluateMx(mx),
    evaluateSpf(spf),
    evaluateDmarc(dmarc),
    evaluateDkim(dkim, dkimSelector),
    evaluateOptionalPolicy("mta-sts", "MTA-STS", mtaSts, /^v=STSv1(?:;|\s|$)/i),
    evaluateOptionalPolicy("tls-reporting", "TLS reporting", tlsReporting, /^v=TLSRPTv1(?:;|\s|$)/i)
  ];

  return { domain, summary: summarizeChecks(checks), checks };
}

export function evaluateMx(outcome: TxtOutcome): DiagnosticCheck {
  if (outcome.error) return transportError("mx", "Mail exchangers (MX)", outcome.error);
  if (!outcome.records.length) return { id: "mx", label: "Mail exchangers (MX)", status: "fail", summary: "No MX record is published." };
  return { id: "mx", label: "Mail exchangers (MX)", status: "pass", summary: `${outcome.records.length} mail exchanger${outcome.records.length === 1 ? "" : "s"} published.`, records: outcome.records };
}

export function evaluateSpf(outcome: TxtOutcome): DiagnosticCheck {
  if (outcome.error) return transportError("spf", "SPF policy", outcome.error);
  const policies = outcome.records.filter((record) => /^v=spf1(?:\s|$)/i.test(record.trim()));
  if (!policies.length) return { id: "spf", label: "SPF policy", status: "fail", summary: "No recognizable v=spf1 policy is published." };
  if (policies.length > 1) return { id: "spf", label: "SPF policy", status: "fail", summary: "Multiple SPF policies are published; receivers cannot reliably evaluate them.", records: policies };
  return { id: "spf", label: "SPF policy", status: "pass", summary: "One recognizable SPF policy is published.", records: policies };
}

export function evaluateDmarc(outcome: TxtOutcome): DiagnosticCheck {
  if (outcome.error) return transportError("dmarc", "DMARC policy", outcome.error);
  const policy = outcome.records.find((record) => /^v=DMARC1(?:;|\s|$)/i.test(record.trim()));
  if (!policy) return { id: "dmarc", label: "DMARC policy", status: "fail", summary: "No valid v=DMARC1 policy is published." };
  const disposition = policy.match(/(?:^|;)\s*p\s*=\s*(none|quarantine|reject)(?:;|$)/i)?.[1]?.toLowerCase();
  if (!disposition) return { id: "dmarc", label: "DMARC policy", status: "fail", summary: "The DMARC record has no valid p policy.", records: [policy] };
  if (disposition === "none") return { id: "dmarc", label: "DMARC policy", status: "warning", summary: "DMARC is monitoring only (p=none).", records: [policy] };
  return { id: "dmarc", label: "DMARC policy", status: "pass", summary: `DMARC enforcement is enabled (p=${disposition}).`, records: [policy] };
}

export function evaluateDkim(outcome: TxtOutcome, selector?: string): DiagnosticCheck {
  if (!selector) return { id: "dkim", label: "DKIM public key", status: "info", summary: "Enter a DKIM selector to check a published public key." };
  if (outcome.error) return transportError("dkim", "DKIM public key", outcome.error);
  const valid = outcome.records.find((record) => /^v=DKIM1(?:;|\s|$)/i.test(record.trim()) && /(?:^|;)\s*p\s*=\s*[^;\s]+/i.test(record));
  if (!valid) return { id: "dkim", label: "DKIM public key", status: "fail", summary: `No valid DKIM public-key record was found for selector “${selector}”.`, records: outcome.records.length ? outcome.records : undefined };
  return { id: "dkim", label: "DKIM public key", status: "pass", summary: `A DKIM public key is published for selector “${selector}”.`, records: [valid] };
}

function evaluateOptionalPolicy(id: string, label: string, outcome: TxtOutcome, pattern: RegExp): DiagnosticCheck {
  if (outcome.error) return transportError(id, label, outcome.error);
  const record = outcome.records.find((value) => pattern.test(value.trim()));
  return record
    ? { id, label, status: "info", summary: `${label} is published as an optional enhancement.`, records: [record] }
    : { id, label, status: "info", summary: `${label} is optional and is not currently published.` };
}

async function querySystemTxt(name: string): Promise<TxtOutcome> {
  const resolver = new Resolver({ timeout: 3_000, tries: 1 });
  try {
    return { records: normalizeResolverAnswers((await resolver.resolveTxt(name)).map((record) => record.join(""))) };
  } catch (error) {
    return toDnsOutcome(error);
  }
}

async function querySystemMx(name: string): Promise<TxtOutcome> {
  const resolver = new Resolver({ timeout: 3_000, tries: 1 });
  try {
    return { records: normalizeDnsRecords("MX", await resolver.resolveMx(name)) };
  } catch (error) {
    return toDnsOutcome(error);
  }
}

function toDnsOutcome(error: unknown): TxtOutcome {
  return NO_ANSWER_CODES.has(dnsErrorCode(error))
    ? { records: [], noAnswer: true }
    : { records: [], error: dnsErrorMessage(error) };
}

function transportError(id: string, label: string, error: string): DiagnosticCheck {
  return { id, label, status: "error", summary: `DNS query failed: ${error}` };
}

function dnsErrorCode(error: unknown) {
  return isRecord(error) && typeof error.code === "string" ? error.code : "UNKNOWN";
}

function dnsErrorMessage(error: unknown) {
  const code = dnsErrorCode(error);
  return code !== "UNKNOWN" ? code : error instanceof Error ? error.message : "Lookup failed";
}

function stableStringify(value: Record<string, unknown>) {
  return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
