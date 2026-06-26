# buffer.lol backend plan

## Current shape

The Next.js app now has a shared same-origin diagnostics route:

- `POST /api/tools/dns-lookup`
- `POST /api/tools/http-headers`
- `POST /api/tools/ssl-checker`
- `POST /api/tools/uptime`
- `POST /api/tools/port-checker`
- `POST /api/tools/whois-lookup`
- `POST /api/tools/redirect-checker`
- `POST /api/tools/robots-sitemap`
- `POST /api/tools/my-ip`
- `POST /api/tools/ip-geolocation`
- `POST /api/tools/asn-lookup`

Requests accept `{ "input": "target" }` and responses use `{ data, error, durationMs, requestId }`. The implementation is intentionally serverless-friendly: it uses Node DNS/TLS/TCP/fetch APIs, validates targets, rejects private/local/reserved/multicast addresses, caps fetch time and text output, and does not shell out.

Ping, packet loss, and traceroute return `501` for now because they need lower-level network privileges that do not fit a typical Netlify/Next serverless runtime.

## Recommended worker shape

Build a small, stateless API using **FastAPI** (Python) or **Node/Express**. Package it in Docker and deploy it behind an Nginx reverse proxy. Nginx should terminate TLS, enforce conservative body-size and connection limits, and forward only the explicitly supported `/api/*` routes.

Suggested worker endpoints:

- `POST /api/ping`
- `POST /api/packet-loss`
- `POST /api/traceroute`

Keep the same envelope as the Next route. The frontend tool registry and `ToolExperience` component already post to one endpoint per tool slug, so those worker routes can either replace the current `501` responses or be proxied behind the same `/api/tools/:slug` surface.

## Security requirements

- Strictly validate and normalize every domain, IP address, URL, record type, and port.
- Resolve hostnames server-side, then block loopback, link-local, private/internal, multicast, metadata-service, and reserved IP ranges for both IPv4 and IPv6. Re-check after redirects and DNS resolution to prevent SSRF and DNS rebinding.
- Rate limit by client and target; add global concurrency limits and short-lived request deduplication.
- Allow only `http` and `https` where URLs are accepted. Never forward arbitrary headers, request bodies, or credentials, and do not behave as an open proxy.
- Prefer library APIs over shell commands. If an OS networking tool is unavoidable, use fixed executable paths and argument arrays—never a shell—and allowlist every option.
- Apply hard timeouts, hop/count limits, response-size caps, redirect limits, and output truncation to every network operation.
- Run the container as a non-root user with a read-only filesystem, minimal Linux capabilities, and restricted egress where practical.
- Log request IDs, operation type, duration, and coarse outcomes without retaining sensitive payloads or full visitor IP addresses longer than necessary.
- Add CORS restrictions, CSRF-aware method design, abuse monitoring, dependency scanning, and tests for SSRF bypasses before launch.

## Deployment notes

Use separate frontend and API containers in Docker Compose for local development. In production, route `/api/` from Nginx to the API service and everything else to Next.js. Add health checks, structured logs, metrics for latency/error/rate-limit events, and environment-based configuration for trusted proxies and provider credentials.
