function analyticsOrigin() {
  try {
    const url = new URL(process.env.BUFFERDASH_URL || "");
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

const isDevelopment = process.env.NODE_ENV !== "production";
const bufferDashOrigin = analyticsOrigin();
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://*.buffer.lol${isDevelopment ? " 'unsafe-eval'" : ""}${bufferDashOrigin ? ` ${bufferDashOrigin}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.buffer.lol${isDevelopment ? " ws: wss:" : ""}${bufferDashOrigin ? ` ${bufferDashOrigin}` : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
      ]
    }];
  }
};

export default nextConfig;
