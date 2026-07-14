import { describe, expect, it } from "vitest";
import {
  compareDnsResolvers,
  evaluateDkim,
  evaluateDmarc,
  evaluateSpf,
  normalizeDnsRecords,
  normalizeResolverAnswers
} from "../app/api/_lib/dns-diagnostics";

describe("resolver comparison", () => {
  it("normalizes, deduplicates, and sorts answer values", () => {
    expect(normalizeResolverAnswers(["b.example", "a.example", "b.example"])).toEqual(["a.example", "b.example"]);
    expect(normalizeDnsRecords("MX", [{ exchange: "MAIL.EXAMPLE.", priority: 20 }, { exchange: "mx.example", priority: 10 }])).toEqual(["10 mx.example", "20 mail.example"]);
    expect(normalizeDnsRecords("CAA", [{ critical: 0, issue: "letsencrypt.org" }])).toEqual(["0 issue letsencrypt.org"]);
  });

  it("ignores answer order when detecting consistency", async () => {
    const result = await compareDnsResolvers("consistent.example", "A", async (resolver) => ({
      answers: resolver.id === "google" ? ["203.0.113.2", "203.0.113.1"] : ["203.0.113.1", "203.0.113.2"],
      latencyMs: 10
    }));
    expect(result.summary).toMatchObject({ allSuccessfulAnswersAgree: true, uniqueAnswerSets: 1, successfulResolvers: 4 });
    expect(result.resolvers.every((resolver) => resolver.status === "match")).toBe(true);
  });

  it("returns partial success when a resolver times out", async () => {
    const result = await compareDnsResolvers("partial.example", "AAAA", async (resolver) => {
      if (resolver.id === "quad9") throw Object.assign(new Error("timed out"), { code: "ETIMEOUT" });
      return { answers: ["2001:db8::1"], latencyMs: 12 };
    });
    expect(result.summary.successfulResolvers).toBe(3);
    expect(result.resolvers.find((resolver) => resolver.id === "quad9")?.status).toBe("error");
    expect(result.summary.allSuccessfulAnswersAgree).toBe(true);
  });
});

describe("email DNS evaluation", () => {
  it("handles missing, valid, and duplicate SPF policies", () => {
    expect(evaluateSpf({ records: [] }).status).toBe("fail");
    expect(evaluateSpf({ records: ["v=spf1 include:_spf.example -all"] }).status).toBe("pass");
    expect(evaluateSpf({ records: ["v=spf1 -all", "v=spf1 ~all"] }).status).toBe("fail");
  });

  it("evaluates missing, monitoring, quarantine, and reject DMARC", () => {
    expect(evaluateDmarc({ records: [] }).status).toBe("fail");
    expect(evaluateDmarc({ records: ["v=DMARC1; p=none"] }).status).toBe("warning");
    expect(evaluateDmarc({ records: ["v=DMARC1; p=quarantine"] }).status).toBe("pass");
    expect(evaluateDmarc({ records: ["v=DMARC1; p=reject"] }).status).toBe("pass");
  });

  it("keeps DKIM informational without a selector and fails invalid records", () => {
    expect(evaluateDkim({ records: [] }).status).toBe("info");
    expect(evaluateDkim({ records: ["v=DKIM1; k=rsa; p="] }, "default").status).toBe("fail");
  });

  it("keeps DNS transport errors distinct from no-record results", () => {
    expect(evaluateSpf({ records: [], error: "ETIMEOUT" }).status).toBe("error");
    expect(evaluateSpf({ records: [], noAnswer: true }).status).toBe("fail");
  });
});
