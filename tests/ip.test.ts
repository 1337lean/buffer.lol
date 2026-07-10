import { describe, expect, it } from "vitest";
import { isPublicIp, normalizeIpLiteral } from "../app/api/_lib/ip";

describe("IP target validation", () => {
  it("accepts ordinary public addresses", () => {
    expect(isPublicIp("1.1.1.1")).toBe(true);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
  });

  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "::127.0.0.1",
    "::ffff:127.0.0.1",
    "::ffff:0:127.0.0.1",
    "64:ff9b:1::7f00:1",
    "fc00::1",
    "fe80::1"
  ])("rejects non-public address %s", (address) => {
    expect(isPublicIp(address)).toBe(false);
  });

  it("normalizes bracketed IPv6 literals", () => {
    expect(normalizeIpLiteral("[2606:4700:4700::1111]")).toBe("2606:4700:4700::1111");
  });
});
