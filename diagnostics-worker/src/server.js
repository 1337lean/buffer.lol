import { execFile } from "node:child_process";
import dns from "node:dns/promises";
import http from "node:http";
import net from "node:net";
import { domainToASCII } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 8080);
const TOKEN = process.env.DIAGNOSTICS_WORKER_TOKEN || "";
const INCLUDE_RAW_DIAGNOSTICS = process.env.INCLUDE_RAW_DIAGNOSTICS === "true";
const MAX_BODY_BYTES = 4 * 1024;
const COMMAND_TIMEOUT_MS = 12_000;
const PING_COUNT = clampInteger(process.env.PING_COUNT, 1, 10, 4);
const PACKET_LOSS_COUNT = clampInteger(process.env.PACKET_LOSS_COUNT, 4, 50, 20);
const TRACEROUTE_MAX_HOPS = clampInteger(process.env.TRACEROUTE_MAX_HOPS, 4, 64, 30);

if (!TOKEN && process.env.NODE_ENV === "production") {
  throw new Error("DIAGNOSTICS_WORKER_TOKEN is required in production.");
}

const IPV4_BLOCKED_RANGES = [
  [0x00000000, 0x00ffffff],
  [0x0a000000, 0x0affffff],
  [0x64400000, 0x647fffff],
  [0x7f000000, 0x7fffffff],
  [0xa9fe0000, 0xa9feffff],
  [0xac100000, 0xac1fffff],
  [0xc0000000, 0xc00000ff],
  [0xc0000200, 0xc00002ff],
  [0xc0a80000, 0xc0a8ffff],
  [0xc6120000, 0xc613ffff],
  [0xc6336400, 0xc63364ff],
  [0xcb007100, 0xcb0071ff],
  [0xe0000000, 0xefffffff],
  [0xf0000000, 0xffffffff]
];

const IPV6_BLOCKED_RANGES = [
  [0n, 128],
  [1n, 128],
  [ipv6ToBigInt("::"), 96],
  [ipv6ToBigInt("::ffff:0:0:0"), 96],
  [ipv6ToBigInt("64:ff9b::"), 96],
  [ipv6ToBigInt("64:ff9b:1::"), 48],
  [ipv6ToBigInt("100::"), 64],
  [ipv6ToBigInt("2001::"), 23],
  [ipv6ToBigInt("2001:2::"), 48],
  [ipv6ToBigInt("2001:db8::"), 32],
  [ipv6ToBigInt("2002::"), 16],
  [ipv6ToBigInt("fc00::"), 7],
  [ipv6ToBigInt("fe80::"), 10],
  [ipv6ToBigInt("ff00::"), 8]
];

const server = http.createServer(async (request, response) => {
  const started = Date.now();

  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    if (!isAuthorized(request)) {
      sendJson(response, 401, { error: "Unauthorized." });
      return;
    }

    const body = await readJsonBody(request);
    const input = typeof body.input === "string" ? body.input : "";
    const path = new URL(request.url || "/", "http://worker.local").pathname;
    const data = await runTool(path, input);

    sendJson(response, 200, { data, durationMs: Date.now() - started });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unexpected diagnostics worker error.";
    sendJson(response, status, { error: message, durationMs: Date.now() - started });
  }
});

server.listen(PORT, () => {
  console.log(`diagnostics worker listening on :${PORT}`);
});

async function runTool(path, input) {
  switch (path) {
    case "/api/ping":
      return runPing(input, PING_COUNT);
    case "/api/packet-loss":
      return runPacketLoss(input);
    case "/api/traceroute":
      return runTraceroute(input);
    default:
      throw new ApiError("Unknown diagnostics endpoint.", 404);
  }
}

async function runPing(input, count) {
  const target = await resolvePublicTarget(input);
  const output = await runCommand("ping", pingArgs(target.address, count));
  const parsed = parsePing(output.stdout || output.stderr);

  return {
    target: target.input,
    resolvedAddress: target.address,
    resolvedFamily: target.family,
    transmitted: parsed.transmitted,
    received: parsed.received,
    packetLossPercent: parsed.packetLossPercent,
    minMs: parsed.minMs,
    avgMs: parsed.avgMs,
    maxMs: parsed.maxMs,
    stddevMs: parsed.stddevMs,
    replies: parsed.replies,
    raw: parsed.raw
  };
}

async function runPacketLoss(input) {
  const result = await runPing(input, PACKET_LOSS_COUNT);

  return {
    ...result,
    samples: PACKET_LOSS_COUNT,
    lost: Math.max(0, result.transmitted - result.received),
    healthy: result.packetLossPercent === 0
  };
}

async function runTraceroute(input) {
  const target = await resolvePublicTarget(input);
  const familyFlag = target.family === 6 ? "-6" : "-4";
  const output = await runCommand("traceroute", [
    familyFlag,
    "-n",
    "-w",
    "2",
    "-q",
    "1",
    "-m",
    String(TRACEROUTE_MAX_HOPS),
    target.address
  ]);
  const parsed = parseTraceroute(output.stdout || output.stderr);

  return {
    target: target.input,
    resolvedAddress: target.address,
    resolvedFamily: target.family,
    maxHops: TRACEROUTE_MAX_HOPS,
    reached: parsed.hops.some((hop) => hop.address === target.address),
    hops: parsed.hops,
    ...(INCLUDE_RAW_DIAGNOSTICS ? { raw: parsed.raw } : {})
  };
}

function pingArgs(address, count) {
  return ["-n", "-c", String(count), "-W", "2", "-i", count > 10 ? "0.3" : "0.2", address];
}

async function runCommand(command, args) {
  try {
    return await execFileAsync(command, args, {
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 256 * 1024
    });
  } catch (error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";

    if (stdout || stderr) {
      return { stdout, stderr };
    }

    if (error.killed || error.signal === "SIGTERM") {
      throw new ApiError("Diagnostics command timed out.", 504);
    }

    throw new ApiError(error.message || "Diagnostics command failed.", 502);
  }
}

function parsePing(output) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  const statsLine = lines.find((line) => /packets transmitted/.test(line)) || "";
  const rttLine = lines.find((line) => /(?:rtt|round-trip).* = /.test(line)) || "";
  const statsMatch = statsLine.match(/(\d+)\s+packets transmitted,\s+(\d+)\s+(?:packets )?received,\s+(?:\+\d+\s+errors,\s+)?([\d.]+)%\s+packet loss/);
  const rttMatch = rttLine.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/);
  const replies = [];

  for (const line of lines) {
    const replyMatch = line.match(/(?:icmp_seq|seq)=(\d+).*time[=<]([\d.]+)\s*ms/);
    if (replyMatch) {
      replies.push({
        sequence: Number(replyMatch[1]),
        timeMs: Number(replyMatch[2])
      });
    }
  }

  return {
    transmitted: statsMatch ? Number(statsMatch[1]) : replies.length,
    received: statsMatch ? Number(statsMatch[2]) : replies.length,
    packetLossPercent: statsMatch ? Number(statsMatch[3]) : null,
    minMs: rttMatch ? Number(rttMatch[1]) : null,
    avgMs: rttMatch ? Number(rttMatch[2]) : null,
    maxMs: rttMatch ? Number(rttMatch[3]) : null,
    stddevMs: rttMatch ? Number(rttMatch[4]) : null,
    replies,
    raw: output.trim()
  };
}

function parseTraceroute(output) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  const hops = [];

  for (const line of lines.slice(1)) {
    const hopMatch = line.trim().match(/^(\d+)\s+(.*)$/);
    if (!hopMatch) continue;

    const rest = hopMatch[2];
    const timeout = rest.includes("*") && !/\d+(?:\.\d+)?\s*ms/.test(rest);
    const addressMatch = rest.match(/((?:\d{1,3}\.){3}\d{1,3}|[a-f0-9:]{2,})/i);
    const parsedAddress = addressMatch ? addressMatch[1] : null;
    const internal = Boolean(parsedAddress && !isPublicIp(parsedAddress));
    const timings = Array.from(rest.matchAll(/(\d+(?:\.\d+)?)\s*ms/g), (match) => Number(match[1]));

    hops.push({
      hop: Number(hopMatch[1]),
      address: internal ? null : parsedAddress,
      rttMs: timings[0] ?? null,
      timeout,
      internal
    });
  }

  return { hops, raw: output.trim() };
}

async function resolvePublicTarget(input) {
  const normalized = normalizeTarget(input);

  if (net.isIP(normalized)) {
    if (!isPublicIp(normalized)) {
      throw new ApiError("Private, local, reserved, and multicast IPs are not allowed.", 400);
    }

    return {
      input: normalized,
      hostname: normalized,
      address: normalized,
      family: net.isIP(normalized)
    };
  }

  let addresses;
  try {
    addresses = await dns.lookup(normalized, { all: true, verbatim: false });
  } catch {
    throw new ApiError("Hostname could not be resolved.", 400);
  }

  const blocked = addresses.find((address) => !isPublicIp(address.address));
  if (blocked) {
    throw new ApiError("Resolved address is private, local, reserved, or multicast.", 400);
  }

  const selected = addresses.find((address) => address.family === 4) || addresses[0];
  if (!selected) {
    throw new ApiError("Hostname did not resolve to any addresses.", 400);
  }

  return {
    input: normalized,
    hostname: normalized,
    address: selected.address,
    family: selected.family
  };
}

function normalizeTarget(input) {
  const raw = normalizeIpLiteral(input).replace(/\.$/, "").toLowerCase();

  if (!raw) throw new ApiError("Enter a hostname or public IP address.", 400);
  if (raw.length > 253) throw new ApiError("Input is too long.", 400);

  if (net.isIP(raw)) return raw;

  const ascii = domainToASCII(raw);
  const labels = ascii.split(".");
  const valid = ascii === raw && labels.length > 1 && labels.every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );

  if (!valid) {
    throw new ApiError("Enter a valid public hostname.", 400);
  }

  return ascii;
}

function isAuthorized(request) {
  if (!TOKEN) return true;
  return request.headers.authorization === `Bearer ${TOKEN}`;
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ApiError("Request body is too large.", 413);
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError("Request body must be valid JSON.", 400);
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeIpLiteral(value) {
  return String(value || "").trim().replace(/^\[|\]$/g, "");
}

function isPublicIp(address) {
  const normalized = normalizeIpLiteral(address);

  if (net.isIPv4(normalized)) {
    const value = ipv4ToNumber(normalized);
    return !IPV4_BLOCKED_RANGES.some(([start, end]) => value >= start && value <= end);
  }

  if (!net.isIPv6(normalized)) return false;

  const mappedIpv4 = ipv4FromMappedIpv6(normalized);
  if (mappedIpv4) return isPublicIp(mappedIpv4);

  const value = ipv6ToBigInt(normalized);
  return !IPV6_BLOCKED_RANGES.some(([range, prefix]) => ipv6InRange(value, range, prefix));
}

function ipv4ToNumber(address) {
  const parts = address.split(".").map(Number);
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function ipv4FromMappedIpv6(address) {
  const expanded = expandIpv6(address);

  if (expanded.slice(0, 5).every((part) => part === 0) && expanded[5] === 0xffff) {
    const high = expanded[6];
    const low = expanded[7];
    return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
  }

  return null;
}

function ipv6ToBigInt(address) {
  return expandIpv6(address).reduce((value, part) => (value << 16n) + BigInt(part), 0n);
}

function expandIpv6(address) {
  const withoutZone = address.split("%")[0].toLowerCase();
  const withIpv4 = withoutZone.includes(".") ? replaceEmbeddedIpv4(withoutZone) : withoutZone;
  const pieces = withIpv4.split("::");

  if (pieces.length > 2) return [];

  const head = pieces[0] ? pieces[0].split(":") : [];
  const tail = pieces[1] ? pieces[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  const parts = pieces.length === 2 ? [...head, ...Array(Math.max(0, missing)).fill("0"), ...tail] : head;

  return parts.map((part) => Number.parseInt(part || "0", 16));
}

function replaceEmbeddedIpv4(address) {
  const lastColon = address.lastIndexOf(":");
  const ipv4 = address.slice(lastColon + 1);
  const number = ipv4ToNumber(ipv4);
  const high = ((number >>> 16) & 0xffff).toString(16);
  const low = (number & 0xffff).toString(16);

  return `${address.slice(0, lastColon + 1)}${high}:${low}`;
}

function ipv6InRange(value, range, prefix) {
  const shift = BigInt(128 - prefix);
  return (value >> shift) === (range >> shift);
}

class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}
