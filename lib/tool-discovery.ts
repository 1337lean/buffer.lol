import type { Tool } from "@/data/tools";

export const RECENT_TOOLS_KEY = "buffer.lol:recent-tools:v1";
export const DEFAULT_QUICK_ACCESS = ["dns-lookup", "http-headers", "my-ip", "json-formatter"];

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function searchTools(toolList: Tool[], query: string, limit = 10): Tool[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];
  const tokens = normalizedQuery.split(" ");

  return toolList
    .flatMap((tool) => {
      const name = normalizeSearch(tool.name);
      const command = normalizeSearch(tool.command);
      const description = normalizeSearch(tool.description);
      const keywords = tool.keywords.map(normalizeSearch);
      const nameTokens = name.split(" ");
      const searchable = [name, command, description, ...keywords];

      if (!tokens.every((token) => searchable.some((field) => field.includes(token)))) return [];

      let rank = 5;
      if (name === normalizedQuery) rank = 0;
      else if (name.startsWith(normalizedQuery)) rank = 1;
      else if (command === normalizedQuery || command.startsWith(normalizedQuery)) rank = 2;
      else if (tokens.every((token) => nameTokens.some((nameToken) => nameToken === token || nameToken.startsWith(token)))) rank = 3;
      else if (tokens.every((token) => keywords.some((keyword) => keyword.includes(token)))) rank = 4;

      return [{ tool, rank }];
    })
    .sort((left, right) => left.rank - right.rank || left.tool.name.localeCompare(right.tool.name))
    .slice(0, limit)
    .map(({ tool }) => tool);
}

export function readRecentTools(storage: StorageLike, validSlugs?: Set<string>): string[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(RECENT_TOOLS_KEY) || "[]");
    if (!Array.isArray(parsed)) throw new Error("Invalid recent tools value");
    return Array.from(new Set(parsed.filter((slug): slug is string => typeof slug === "string" && (!validSlugs || validSlugs.has(slug))))).slice(0, 5);
  } catch {
    try { storage.removeItem(RECENT_TOOLS_KEY); } catch { /* Storage may be unavailable. */ }
    return [];
  }
}

export function recordRecentTool(storage: StorageLike, slug: string, validSlugs?: Set<string>): string[] {
  if (validSlugs && !validSlugs.has(slug)) return readRecentTools(storage, validSlugs);
  const recent = [slug, ...readRecentTools(storage, validSlugs).filter((item) => item !== slug)].slice(0, 5);
  try { storage.setItem(RECENT_TOOLS_KEY, JSON.stringify(recent)); } catch { /* Storage may be unavailable. */ }
  return recent;
}

export function safeTargetPrefill(value: string | string[] | undefined) {
  if (typeof value !== "string") return "";
  const target = value.trim();
  if (!target || target.length > 2048 || /[\s\u0000-\u001f]/.test(target)) return "";

  try {
    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(target) ? new URL(target) : new URL(`https://${target}`);
    if (!new Set(["http:", "https:"]).has(candidate.protocol) || candidate.username || candidate.password) return "";
    const hostname = candidate.hostname.toLowerCase().replace(/[\[\]]/g, "");
    if (!isPublicLookingHostname(hostname)) return "";
    return target;
  } catch {
    return "";
  }
}

function isPublicLookingHostname(hostname: string) {
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)?.slice(1).map(Number);
  if (ipv4) {
    if (ipv4.some((part) => part > 255)) return false;
    const value = (((ipv4[0] << 24) >>> 0) + (ipv4[1] << 16) + (ipv4[2] << 8) + ipv4[3]) >>> 0;
    const blocked: Array<[number, number]> = [
      [0x00000000, 0x00ffffff], [0x0a000000, 0x0affffff], [0x64400000, 0x647fffff],
      [0x7f000000, 0x7fffffff], [0xa9fe0000, 0xa9feffff], [0xac100000, 0xac1fffff],
      [0xc0000000, 0xc00000ff], [0xc0000200, 0xc00002ff], [0xc0a80000, 0xc0a8ffff],
      [0xc6120000, 0xc613ffff], [0xc6336400, 0xc63364ff], [0xcb007100, 0xcb0071ff],
      [0xe0000000, 0xefffffff], [0xf0000000, 0xffffffff]
    ];
    return !blocked.some(([start, end]) => value >= start && value <= end);
  }
  if (hostname.includes(":")) return !/^(?:::|::1$|fc|fd|fe[89ab]|ff|2001:db8:|2001:0*:)/i.test(hostname);
  return hostname.includes(".");
}
