import { describe, expect, it } from "vitest";
import { evaluateSecurityHeaders, inspectHttpSecurity } from "../app/api/_lib/http-security";

describe("security header evaluation", () => {
  it("produces pass, warning, fail, and optional informational states", () => {
    const checks = evaluateSecurityHeaders(new URL("https://example.com"), {
      "strict-transport-security": "max-age=31536000",
      "content-security-policy": "default-src 'self'",
      "x-content-type-options": "nosniff"
    });
    expect(checks.find((check) => check.id === "https")?.status).toBe("pass");
    expect(checks.find((check) => check.id === "clickjacking")?.status).toBe("fail");
    expect(checks.find((check) => check.id === "referrer-policy")?.status).toBe("warning");
    expect(checks.find((check) => check.id === "coep")?.status).toBe("info");
  });

  it("accepts CSP frame-ancestors as clickjacking protection", () => {
    const checks = evaluateSecurityHeaders(new URL("https://example.com"), {
      "content-security-policy": "default-src 'self'; frame-ancestors 'none'"
    });
    expect(checks.find((check) => check.id === "clickjacking")?.status).toBe("pass");
  });
});

describe("redirect-safe header fetching", () => {
  it("follows at most five redirects and falls back from HEAD to ranged GET", async () => {
    let calls = 0;
    const methods: string[] = [];
    const result = await inspectHttpSecurity("https://example.com", async (_url, init) => {
      calls += 1;
      methods.push(init.method || "GET");
      if (calls === 1) return new Response(null, { status: 405 });
      if (calls === 2) return new Response(null, { status: 302, headers: { location: "/final" } });
      return new Response(null, { status: 204, headers: { "x-content-type-options": "nosniff" } });
    }, (input) => new URL(input));
    expect(methods).toEqual(["HEAD", "GET", "HEAD"]);
    expect(result).toMatchObject({ finalUrl: "https://example.com/final", redirectCount: 1, statusCode: 204 });
  });

  it("rejects redirects to private or reserved destinations during revalidation", async () => {
    await expect(inspectHttpSecurity("https://example.com", async () => new Response(null, {
      status: 302,
      headers: { location: "http://10.0.0.1/admin" }
    }), (input) => {
      const url = new URL(input);
      if (url.hostname === "10.0.0.1") throw new Error("private target rejected");
      return url;
    })).rejects.toThrow("private target rejected");
  });

  it("enforces the five-redirect cap", async () => {
    await expect(inspectHttpSecurity("https://example.com/0", async (url) => {
      const hop = Number(url.pathname.slice(1));
      return new Response(null, { status: 302, headers: { location: `/${hop + 1}` } });
    }, (input) => new URL(input))).rejects.toThrow(/maximum 5/);
  });
});
