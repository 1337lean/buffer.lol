import { describe, expect, it } from "vitest";
import type { Tool } from "../data/tools";
import { tools } from "../data/tools";
import { normalizeSearch, readRecentTools, recordRecentTool, RECENT_TOOLS_KEY, safeTargetPrefill, searchTools } from "../lib/tool-discovery";

function tool(name: string, overrides: Partial<Tool> = {}): Tool {
  return {
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    description: "Useful network diagnostics",
    category: "networking",
    command: "check",
    status: "available",
    runtime: "local",
    keywords: [],
    seo: {
      title: `${name} online`,
      metaDescription: "A complete description of this useful network diagnostic tool for testing.",
      updatedAt: "2026-07-19",
      intro: "A useful introduction.",
      sections: [],
      faq: []
    },
    ...overrides
  };
}

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("tool launcher search", () => {
  it("normalizes accents, punctuation, and whitespace", () => {
    expect(normalizeSearch("  Résolver / DNS_Check  ")).toBe("resolver dns check");
  });

  it("ranks exact names, prefixes, commands, name tokens, and keywords", () => {
    const candidates = [
      tool("DNS Lookup", { command: "dig" }),
      tool("DNS Resolver Comparison", { command: "dig @all", keywords: ["propagation"] }),
      tool("Propagation Watch", { command: "watch" }),
      tool("Other", { command: "dns lookup" })
    ];
    expect(searchTools(candidates, "dns lookup").map((item) => item.name)).toEqual(["DNS Lookup", "Other"]);
    expect(searchTools(candidates, "dig")[0].name).toBe("DNS Lookup");
    expect(searchTools(candidates, "propagation").map((item) => item.name)).toEqual(["Propagation Watch", "DNS Resolver Comparison"]);
  });

  it("requires every token to match and alphabetizes ties", () => {
    const candidates = [
      tool("Zulu Tool", { description: "dns mail" }),
      tool("Alpha Tool", { description: "dns mail" }),
      tool("DNS Only", { description: "dns records" })
    ];
    expect(searchTools(candidates, "dns mail").map((item) => item.name)).toEqual(["Alpha Tool", "Zulu Tool"]);
  });
});

describe("recent tools", () => {
  it("orders most-recent first, deduplicates, and limits to five", () => {
    const storage = new MemoryStorage();
    for (const slug of ["one", "two", "three", "four", "five", "six", "three"]) recordRecentTool(storage, slug);
    expect(readRecentTools(storage)).toEqual(["three", "six", "five", "four", "two"]);
  });

  it("recovers from corrupt storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(RECENT_TOOLS_KEY, "not json");
    expect(readRecentTools(storage)).toEqual([]);
    expect(storage.getItem(RECENT_TOOLS_KEY)).toBeNull();
  });
});

describe("tool registry and target prefilling", () => {
  it("contains 27 tools in the accepted category split", () => {
    expect(tools).toHaveLength(27);
    expect(tools.filter((item) => item.category === "networking")).toHaveLength(15);
    expect(tools.filter((item) => item.category === "ip")).toHaveLength(4);
    expect(tools.filter((item) => item.category === "developer")).toHaveLength(8);
  });

  it("labels each tool with its actual request path", () => {
    expect(tools.find((item) => item.slug === "json-formatter")?.runtime).toBe("local");
    expect(tools.find((item) => item.slug === "ping")?.runtime).toBe("browser");
    expect(tools.find((item) => item.slug === "dns-lookup")?.runtime).toBe("server");
    expect(tools.find((item) => item.slug === "traceroute")?.runtime).toBe("worker");
  });

  it("accepts public-looking targets and rejects private, reserved, or payload values", () => {
    expect(safeTargetPrefill("https://example.com/path")).toBe("https://example.com/path");
    expect(safeTargetPrefill("8.8.8.8")).toBe("8.8.8.8");
    expect(safeTargetPrefill("10.0.0.1")).toBe("");
    expect(safeTargetPrefill("203.0.113.10")).toBe("");
    expect(safeTargetPrefill('{"secret":true}')).toBe("");
  });
});
