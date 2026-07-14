import { describe, expect, it } from "vitest";
import { makeRequestDedupeKey, parseToolRequest } from "../app/api/tools/[slug]/route";

describe("diagnostic request options", () => {
  it("keeps existing input-only requests backward compatible", () => {
    expect(parseToolRequest("dns-lookup", { input: "example.com" })).toEqual({ input: "example.com" });
  });

  it("defaults resolver checks to A and accepts supported record types", () => {
    expect(parseToolRequest("dns-resolver-check", { input: "example.com" })).toEqual({ input: "example.com", options: { recordType: "A" } });
    expect(parseToolRequest("dns-resolver-check", { input: "example.com", options: { recordType: "MX" } })).toEqual({ input: "example.com", options: { recordType: "MX" } });
  });

  it("rejects unsupported record types and malformed DKIM selectors", () => {
    expect(() => parseToolRequest("dns-resolver-check", { input: "example.com", options: { recordType: "SOA" } })).toThrow(/Record type/);
    expect(() => parseToolRequest("email-dns-health", { input: "example.com", options: { dkimSelector: "bad selector!" } })).toThrow(/DKIM selector/);
    expect(() => parseToolRequest("dns-resolver-check", { input: "example.com", options: "A" })).toThrow(/JSON object/);
  });

  it("includes record type and selector in deduplication keys", () => {
    const now = 100_000;
    const a = makeRequestDedupeKey("dns-resolver-check", { input: "example.com", options: { recordType: "A" } }, now);
    const mx = makeRequestDedupeKey("dns-resolver-check", { input: "example.com", options: { recordType: "MX" } }, now);
    const selector1 = makeRequestDedupeKey("email-dns-health", { input: "example.com", options: { dkimSelector: "one" } }, now);
    const selector2 = makeRequestDedupeKey("email-dns-health", { input: "example.com", options: { dkimSelector: "two" } }, now);
    expect(a).not.toBe(mx);
    expect(selector1).not.toBe(selector2);
  });
});
