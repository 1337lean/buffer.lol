export type ToolCategory = "networking" | "ip" | "developer";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  command: string;
  status: "available" | "backend";
  inputLabel?: string;
  inputPlaceholder?: string;
};

export const categoryMeta: Record<
  ToolCategory,
  { title: string; eyebrow: string; description: string }
> = {
  networking: {
    title: "Networking tools",
    eyebrow: "01 / Network",
    description: "Diagnose hosts, domains, routes, certificates, and the web layer."
  },
  ip: {
    title: "IP tools",
    eyebrow: "02 / Identity",
    description: "Understand your public network identity and browser environment."
  },
  developer: {
    title: "Developer tools",
    eyebrow: "03 / Utilities",
    description: "Small, private utilities that run directly inside your browser."
  }
};

export const tools: Tool[] = [
  {
    slug: "ping",
    name: "Ping Tester",
    description: "Check whether a host responds and inspect round-trip latency.",
    category: "networking",
    command: "ping",
    status: "backend",
    inputLabel: "Hostname or IP",
    inputPlaceholder: "example.com"
  },
  {
    slug: "packet-loss",
    name: "Packet Loss Tester",
    description: "Sample connection stability and identify dropped packets.",
    category: "networking",
    command: "loss",
    status: "backend",
    inputLabel: "Hostname or IP",
    inputPlaceholder: "1.1.1.1"
  },
  {
    slug: "traceroute",
    name: "Traceroute Visualizer",
    description: "Follow the hops between this service and a destination.",
    category: "networking",
    command: "trace",
    status: "backend",
    inputLabel: "Destination",
    inputPlaceholder: "example.com"
  },
  {
    slug: "dns-lookup",
    name: "DNS Lookup",
    description: "Inspect A, AAAA, MX, TXT, CNAME, and NS records.",
    category: "networking",
    command: "dig",
    status: "available",
    inputLabel: "Domain name",
    inputPlaceholder: "example.com"
  },
  {
    slug: "http-headers",
    name: "HTTP Header Inspector",
    description: "See response headers, redirects, caching, and server details.",
    category: "networking",
    command: "curl -I",
    status: "available",
    inputLabel: "Website URL",
    inputPlaceholder: "https://example.com"
  },
  {
    slug: "ssl-checker",
    name: "SSL Certificate Checker",
    description: "Review certificate validity, issuer, names, and expiry.",
    category: "networking",
    command: "openssl",
    status: "available",
    inputLabel: "Hostname",
    inputPlaceholder: "example.com"
  },
  {
    slug: "uptime",
    name: "Website Uptime Checker",
    description: "Check reachability, response status, and timing on demand.",
    category: "networking",
    command: "status",
    status: "available",
    inputLabel: "Website URL",
    inputPlaceholder: "https://example.com"
  },
  {
    slug: "port-checker",
    name: "Port Checker",
    description: "Test whether a public TCP port is reachable from the internet.",
    category: "networking",
    command: "nc -z",
    status: "available",
    inputLabel: "Host and port",
    inputPlaceholder: "example.com:443"
  },
  {
    slug: "my-ip",
    name: "What's My IP",
    description: "See the public IP address exposed by your connection.",
    category: "ip",
    command: "whoami",
    status: "available",
    inputLabel: "Public address",
    inputPlaceholder: "Detected automatically"
  },
  {
    slug: "ip-geolocation",
    name: "IP Geolocation",
    description: "Estimate the country, region, and network for a public IP.",
    category: "ip",
    command: "geoip",
    status: "available",
    inputLabel: "IP address",
    inputPlaceholder: "8.8.8.8"
  },
  {
    slug: "asn-lookup",
    name: "ASN / ISP Lookup",
    description: "Find the autonomous system and provider behind an IP.",
    category: "ip",
    command: "whois",
    status: "available",
    inputLabel: "IP address or ASN",
    inputPlaceholder: "1.1.1.1 or AS13335"
  },
  {
    slug: "user-agent",
    name: "User Agent Parser",
    description: "Inspect this browser's user agent and platform signals.",
    category: "ip",
    command: "ua --parse",
    status: "available"
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Validate, format, and minify JSON without sending it anywhere.",
    category: "developer",
    command: "jq",
    status: "available"
  },
  {
    slug: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode UTF-8 text to Base64 or decode it in your browser.",
    category: "developer",
    command: "base64",
    status: "available"
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    description: "Generate SHA-256, SHA-384, or SHA-512 digests locally.",
    category: "developer",
    command: "sha256",
    status: "available"
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    description: "Create one or more RFC 4122 version 4 identifiers.",
    category: "developer",
    command: "uuidgen",
    status: "available"
  },
  {
    slug: "timestamp",
    name: "Timestamp Converter",
    description: "Convert Unix timestamps and readable dates in either direction.",
    category: "developer",
    command: "date +%s",
    status: "available"
  }
];

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
