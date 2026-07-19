export type IPLensScreenshot = {
  id: string;
  label: string;
  command: string;
  alt: string;
  src: string | null;
  width: number;
  height: number;
};

export type IPLensFeature = {
  command: string;
  title: string;
  description: string;
};

export const ipLensConfig = {
  appName: "IP Lens",
  platform: "iPhone",
  minimumOS: "iOS 17 or later",
  supportedPlatforms: ["iPhone running iOS 17 or later"],
  appIcon: "/ip-lens/app-icon.png",
  releaseStatus: "Coming soon",
  appStoreUrl: null as string | null,
  priceText: "$4.99 one-time purchase",
  priceStatus: "Planned App Store price · USD",
  supportEmail: "support@buffer.lol",
  providers: {
    ipData: "ipwho.is / ipwhois.pro",
    freeIPData: "ipwho.is",
    personalIPData: "ipwhois.pro",
    dns: "Cloudflare or Quad9",
    registration: "authoritative RDAP registry",
    bootstrap: "IANA bootstrap data"
  },
  badges: ["No ads", "No subscription", "Native SwiftUI", "iOS 17+", "One-time purchase"],
  screenshots: [
    {
      id: "ip-lookup",
      label: "IP Lookup",
      command: "whois",
      alt: "IP Lens IP Lookup screen showing an IPv4 result with approximate location and map",
      src: "/ip-lens/screenshots/iplookup.png",
      width: 1206,
      height: 2622
    },
    {
      id: "dns-records",
      label: "DNS Records",
      command: "dig",
      alt: "IP Lens DNS Lookup screen showing a Cloudflare query and returned A records",
      src: "/ip-lens/screenshots/dnsrecords.png",
      width: 1206,
      height: 2622
    },
    {
      id: "batch-lookup",
      label: "Batch Lookup",
      command: "batch",
      alt: "IP Lens Batch Lookup screen showing organized results for multiple public and reserved addresses",
      src: "/ip-lens/screenshots/batchlookup.png",
      width: 1206,
      height: 2622
    },
    {
      id: "subnet-calculator",
      label: "Subnet Calculator",
      command: "cidr",
      alt: "IP Lens Subnet Calculator screen showing an offline IPv4 CIDR calculation",
      src: "/ip-lens/screenshots/subnetcalc.png",
      width: 1206,
      height: 2622
    }
  ] satisfies readonly IPLensScreenshot[],
  features: [
    {
      command: "whois",
      title: "IP intelligence",
      description:
        "View approximate location, ASN, ISP, organization, timezone, and network details for public IPv4 and IPv6 addresses."
    },
    {
      command: "dig",
      title: "DNS records",
      description:
        "Inspect A, AAAA, CNAME, MX, NS, TXT, and PTR records through your selected DNS-over-HTTPS resolver."
    },
    {
      command: "batch",
      title: "Batch lookup",
      description: "Analyze up to 50 IP addresses in one organized workflow."
    },
    {
      command: "rdap",
      title: "Registration data",
      description:
        "Review domain, IP, and ASN registration data directly from the authoritative RDAP registry."
    },
    {
      command: "cidr",
      title: "Subnet calculator",
      description:
        "Calculate IPv4 and IPv6 networks, address ranges, masks, prefixes, and capacity entirely offline."
    },
    {
      command: "ptr",
      title: "Reverse DNS",
      description: "Look up the hostname associated with an IP address when one is published."
    },
    {
      command: "save",
      title: "Offline results",
      description: "Keep lookup history, favorites, and saved DNS, RDAP, and batch captures available on-device."
    },
    {
      command: "export",
      title: "Local export",
      description: "Prepare CSV or JSON files locally, then choose where to share them with the iOS share sheet."
    }
  ] satisfies readonly IPLensFeature[],
  audiences: [
    "Developers",
    "Network administrators",
    "IT students",
    "Homelab users",
    "Website owners",
    "Curious users"
  ],
  purchaseIncludes: [
    "Pay once",
    "All included tools",
    "Future maintenance updates",
    "No advertisements",
    "No account required"
  ],
  faq: [
    {
      question: "Does IP Lens require an account?",
      answer: "No. IP Lens does not require an account."
    },
    {
      question: "Does IP Lens have advertisements?",
      answer: "No. The app does not contain advertisements."
    },
    {
      question: "Is IP Lens a subscription?",
      answer: "No. IP Lens is intended to be a one-time App Store purchase."
    },
    {
      question: "Does it work without an internet connection?",
      answer:
        "New IP, DNS, reverse DNS, and registration lookups require a connection. Saved captures and the IPv4/IPv6 subnet calculator work offline."
    },
    {
      question: "Where does lookup data come from?",
      answer:
        "Free IP lookups use ipwho.is, while personal-key mode uses ipwhois.pro. DNS queries go only to the selected Cloudflare or Quad9 resolver. Registration queries go directly to the authoritative RDAP registry selected with IANA bootstrap data."
    },
    {
      question: "Is IP geolocation exact?",
      answer:
        "No. IP geolocation is an estimate and may not represent a device's physical position."
    },
    {
      question: "Which Apple devices are supported?",
      answer: "IP Lens supports iPhone models running iOS 17 or later. iPad and Mac layouts are not part of version 1.0."
    },
    {
      question: "How can I request a feature or report a problem?",
      answer: "Use the IP Lens support page for reporting details and contact information."
    }
  ]
} as const;
