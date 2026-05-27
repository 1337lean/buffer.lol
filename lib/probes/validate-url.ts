import { lookup } from "dns/promises";
import { isIP } from "net";
import { z } from "zod";

const PRIVATE_HOSTS = new Set(["localhost", "localhost.localdomain"]);
const DEFAULT_ALLOWED_PORTS = new Set(["", "80", "443"]);

export const probeInputSchema = z.object({
  url: z.string().trim().url().max(2048),
  probeType: z.enum(["hls", "dash"]),
  region: z.enum(["us-east", "us-west", "eu-west", "apac"])
});

export type ProbeInput = z.infer<typeof probeInputSchema>;

export async function validateProbeUrl(value: string) {
  const url = new URL(value);
  await assertSafeProbeUrl(url);
  return url.toString();
}

export async function assertSafeProbeUrl(url: URL) {
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Probe URL must use http or https.");
  }

  if (process.env.NODE_ENV === "production" && process.env.PROBE_ALLOW_HTTP !== "true" && url.protocol !== "https:") {
    throw new Error("Probe URL must use https in production.");
  }

  if (!DEFAULT_ALLOWED_PORTS.has(url.port)) {
    throw new Error("Probe URL must use the default http or https port.");
  }

  if (!url.hostname || isInternalHostname(url.hostname)) {
    throw new Error("Probe URL cannot target local or internal hostnames.");
  }

  const hostIsIp = isIP(url.hostname);
  const addresses = hostIsIp
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: false }).catch(() => {
        throw new Error("Probe URL hostname could not be resolved.");
      });

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Probe URL cannot target localhost, private, or link-local networks.");
  }
}

function isInternalHostname(hostname: string) {
  const value = hostname.toLowerCase().replace(/\.$/, "");
  return PRIVATE_HOSTS.has(value) || value.endsWith(".local") || value.endsWith(".internal") || value.endsWith(".localhost");
}

export function isPrivateAddress(address: string) {
  if (address === "::" || address === "0:0:0:0:0:0:0:0") return true;
  if (address === "::1" || address === "0:0:0:0:0:0:0:1") return true;
  if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) return true;
  if (address.toLowerCase().startsWith("fe80:")) return true;
  if (address.toLowerCase().startsWith("2001:db8:")) return true;
  if (address.toLowerCase().startsWith("::ffff:")) return isPrivateAddress(address.slice(7));

  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}
