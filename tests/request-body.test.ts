import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { readJsonBody } from "../app/api/tools/[slug]/route";

function requestWithBody(body: string) {
  return new NextRequest("http://localhost/api/tools/dns-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
}

describe("diagnostics request bodies", () => {
  it("parses a small JSON object", async () => {
    await expect(readJsonBody(requestWithBody('{"input":"example.com"}'))).resolves.toEqual({ input: "example.com" });
  });

  it("rejects malformed JSON", async () => {
    await expect(readJsonBody(requestWithBody("{"))).rejects.toMatchObject({ status: 400 });
  });

  it("rejects bodies larger than the streaming limit", async () => {
    const oversized = JSON.stringify({ input: "x".repeat(5_000) });
    await expect(readJsonBody(requestWithBody(oversized))).rejects.toMatchObject({ status: 413 });
  });
});
