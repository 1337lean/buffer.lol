import net from "node:net";

const IPV4_BLOCKED_RANGES: Array<[number, number]> = [
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

const IPV6_BLOCKED_RANGES: Array<[bigint, number]> = [
  [BigInt(0), 128],
  [BigInt(1), 128],
  [ipv6ToBigInt("64:ff9b::"), 96],
  [ipv6ToBigInt("100::"), 64],
  [ipv6ToBigInt("2001::"), 23],
  [ipv6ToBigInt("2001:2::"), 48],
  [ipv6ToBigInt("2001:db8::"), 32],
  [ipv6ToBigInt("2002::"), 16],
  [ipv6ToBigInt("fc00::"), 7],
  [ipv6ToBigInt("fe80::"), 10],
  [ipv6ToBigInt("ff00::"), 8]
];

export function normalizeIpLiteral(value: string) {
  return value.trim().replace(/^\[|\]$/g, "");
}

export function isIpLiteral(value: string) {
  return net.isIP(normalizeIpLiteral(value));
}

export function isPublicIp(address: string) {
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

function ipv4ToNumber(address: string) {
  const parts = address.split(".").map(Number);
  return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
}

function ipv4FromMappedIpv6(address: string) {
  const expanded = expandIpv6(address);

  if (expanded.slice(0, 5).every((part) => part === 0) && expanded[5] === 0xffff) {
    const high = expanded[6];
    const low = expanded[7];
    return [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
  }

  return null;
}

function ipv6ToBigInt(address: string) {
  return expandIpv6(address).reduce((value, part) => (value << BigInt(16)) + BigInt(part), BigInt(0));
}

function expandIpv6(address: string) {
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

function replaceEmbeddedIpv4(address: string) {
  const lastColon = address.lastIndexOf(":");
  const ipv4 = address.slice(lastColon + 1);
  const number = ipv4ToNumber(ipv4);
  const high = ((number >>> 16) & 0xffff).toString(16);
  const low = (number & 0xffff).toString(16);

  return `${address.slice(0, lastColon + 1)}${high}:${low}`;
}

function ipv6InRange(value: bigint, range: bigint, prefix: number) {
  const shift = BigInt(128 - prefix);
  return (value >> shift) === (range >> shift);
}
