import { lookup } from "dns/promises";
import { isIP } from "net";
import { z } from "zod";

const PRIVATE_HOSTS = new Set(["localhost", "localhost.localdomain"]);

export const probeInputSchema = z.object({
  url: z.string().trim().url().max(2048),
  probeType: z.enum(["hls", "dash", "mp4", "upload"]),
  region: z.enum(["us-east", "us-west", "eu-west", "apac"])
});

export type ProbeInput = z.infer<typeof probeInputSchema>;

export async function validateProbeUrl(value: string) {
  const url = new URL(value);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Probe URL must use http or https.");
  }

  if (!url.hostname || PRIVATE_HOSTS.has(url.hostname.toLowerCase()) || url.hostname.endsWith(".local")) {
    throw new Error("Probe URL cannot target local or internal hostnames.");
  }

  const hostIsIp = isIP(url.hostname);
  const addresses = hostIsIp
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true }).catch(() => {
        throw new Error("Probe URL hostname could not be resolved.");
      });

  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Probe URL cannot target localhost, private, or link-local networks.");
  }

  return url.toString();
}

function isPrivateAddress(address: string) {
  if (address === "::1" || address === "0:0:0:0:0:0:0:1") return true;
  if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) return true;
  if (address.toLowerCase().startsWith("fe80:")) return true;

  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}
