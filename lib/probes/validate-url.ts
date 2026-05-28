import { lookup } from "dns/promises";
import { BlockList, isIP } from "net";
import { z } from "zod";

const PRIVATE_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const DEFAULT_ALLOWED_PORTS = new Set(["", "80", "443"]);
const PRIVATE_ADDRESSES = new BlockList();

PRIVATE_ADDRESSES.addSubnet("0.0.0.0", 8, "ipv4");
PRIVATE_ADDRESSES.addSubnet("10.0.0.0", 8, "ipv4");
PRIVATE_ADDRESSES.addSubnet("100.64.0.0", 10, "ipv4");
PRIVATE_ADDRESSES.addSubnet("127.0.0.0", 8, "ipv4");
PRIVATE_ADDRESSES.addSubnet("169.254.0.0", 16, "ipv4");
PRIVATE_ADDRESSES.addSubnet("172.16.0.0", 12, "ipv4");
PRIVATE_ADDRESSES.addSubnet("192.0.0.0", 24, "ipv4");
PRIVATE_ADDRESSES.addSubnet("192.0.2.0", 24, "ipv4");
PRIVATE_ADDRESSES.addSubnet("192.168.0.0", 16, "ipv4");
PRIVATE_ADDRESSES.addSubnet("198.18.0.0", 15, "ipv4");
PRIVATE_ADDRESSES.addSubnet("198.51.100.0", 24, "ipv4");
PRIVATE_ADDRESSES.addSubnet("203.0.113.0", 24, "ipv4");
PRIVATE_ADDRESSES.addSubnet("224.0.0.0", 4, "ipv4");
PRIVATE_ADDRESSES.addSubnet("240.0.0.0", 4, "ipv4");
PRIVATE_ADDRESSES.addAddress("::", "ipv6");
PRIVATE_ADDRESSES.addAddress("::1", "ipv6");
PRIVATE_ADDRESSES.addSubnet("fc00::", 7, "ipv6");
PRIVATE_ADDRESSES.addSubnet("fe80::", 10, "ipv6");
PRIVATE_ADDRESSES.addSubnet("ff00::", 8, "ipv6");
PRIVATE_ADDRESSES.addSubnet("2001:db8::", 32, "ipv6");

export type SafeProbeNetworkTarget = {
  url: URL;
  hostname: string;
  address: string;
  family: 4 | 6;
  hostHeader: string;
};

export const probeInputSchema = z.object({
  url: z.string().trim().url().max(2048),
  probeType: z.enum(["hls", "dash"]),
  region: z.enum(["us-east", "us-west", "eu-west", "apac"])
});

export type ProbeInput = z.infer<typeof probeInputSchema>;

export async function validateProbeUrl(value: string) {
  const url = new URL(value);
  await resolveSafeProbeNetworkTarget(url);
  return url.toString();
}

export async function assertSafeProbeUrl(url: URL) {
  await resolveSafeProbeNetworkTarget(url);
}

export async function resolveSafeProbeNetworkTarget(url: URL): Promise<SafeProbeNetworkTarget> {
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Probe URL must use http or https.");
  }

  if (process.env.NODE_ENV === "production" && process.env.PROBE_ALLOW_HTTP !== "true" && url.protocol !== "https:") {
    throw new Error("Probe URL must use https in production.");
  }

  if (!DEFAULT_ALLOWED_PORTS.has(url.port)) {
    throw new Error("Probe URL must use the default http or https port.");
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname || isInternalHostname(hostname)) {
    throw new Error("Probe URL cannot target local or internal hostnames.");
  }

  const hostIsIp = isIP(hostname);
  const addresses = hostIsIp
    ? [{ address: hostname, family: hostIsIp as 4 | 6 }]
    : await lookup(hostname, { all: true, verbatim: false }).catch(() => {
        throw new Error("Probe URL hostname could not be resolved.");
      });

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Probe URL cannot target localhost, private, or link-local networks.");
  }

  const [selected] = addresses;
  return {
    url,
    hostname,
    address: selected.address,
    family: selected.family as 4 | 6,
    hostHeader: url.host
  };
}

function isInternalHostname(hostname: string) {
  const value = hostname.toLowerCase().replace(/\.$/, "");
  return PRIVATE_HOSTS.has(value) || value.endsWith(".local") || value.endsWith(".internal") || value.endsWith(".localhost");
}

export function isPrivateAddress(address: string) {
  const normalized = normalizeHostname(address);
  const mappedIpv4 = ipv4FromMappedIpv6(normalized);
  if (mappedIpv4) return isPrivateAddress(mappedIpv4);

  const family = isIP(normalized);
  if (family === 4) return PRIVATE_ADDRESSES.check(normalized, "ipv4");
  if (family === 6) return PRIVATE_ADDRESSES.check(normalized, "ipv6");
  return false;
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[(.*)]$/, "$1").replace(/\.$/, "");
}

function ipv4FromMappedIpv6(address: string) {
  const dotted = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  if (dotted && isIP(dotted) === 4) return dotted;

  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!hex) return null;

  const high = Number.parseInt(hex[1], 16);
  const low = Number.parseInt(hex[2], 16);
  if (!Number.isFinite(high) || !Number.isFinite(low)) return null;
  return [high >> 8, high & 255, low >> 8, low & 255].join(".");
}
