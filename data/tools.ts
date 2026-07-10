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
    name: "Browser Latency Test",
    description: "Measure this browser's latency to buffer.lol.",
    category: "networking",
    command: "latency",
    status: "available"
  },
  {
    slug: "packet-loss",
    name: "Connection Stability Test",
    description: "Sample this browser's connection stability to buffer.lol.",
    category: "networking",
    command: "stability",
    status: "available"
  },
  {
    slug: "traceroute",
    name: "Traceroute Visualizer",
    description: "Trace hops from buffer.lol's diagnostics server to a destination.",
    category: "networking",
    command: "trace",
    status: "available",
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
    slug: "cidr-calculator",
    name: "CIDR Calculator",
    description: "Calculate IPv4 network ranges, masks, broadcast addresses, and host counts.",
    category: "networking",
    command: "cidr",
    status: "available"
  },
  {
    slug: "whois-lookup",
    name: "WHOIS Lookup",
    description: "Look up domain registration, registrar, nameserver, and expiry details.",
    category: "networking",
    command: "whois",
    status: "available",
    inputLabel: "Domain or IP",
    inputPlaceholder: "example.com"
  },
  {
    slug: "redirect-checker",
    name: "Redirect Checker",
    description: "Follow redirects and inspect status codes, locations, and timing.",
    category: "networking",
    command: "redirects",
    status: "available",
    inputLabel: "Website URL",
    inputPlaceholder: "https://example.com"
  },
  {
    slug: "robots-sitemap",
    name: "Robots.txt / Sitemap Checker",
    description: "Inspect robots.txt rules and discover sitemap declarations for a website.",
    category: "networking",
    command: "robots",
    status: "available",
    inputLabel: "Website URL",
    inputPlaceholder: "https://example.com"
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
    name: "IP Network Lookup",
    description: "Inspect the country, registered network, and ASN for a public IP.",
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
  },
  {
    slug: "url-parser",
    name: "URL Parser / Encoder",
    description: "Parse URLs, inspect query parameters, and encode or decode URL components locally.",
    category: "developer",
    command: "url",
    status: "available"
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode JWT headers and payloads locally without verifying signatures.",
    category: "developer",
    command: "jwt",
    status: "available"
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    description: "Test JavaScript regular expressions and inspect matches, groups, and indexes.",
    category: "developer",
    command: "regex",
    status: "available"
  }
];

export function getToolsByCategory(category: ToolCategory) {
  return tools.filter((tool) => tool.category === category);
}

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
