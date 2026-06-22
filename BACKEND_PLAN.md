# buffer.lol backend plan

## Recommended shape

Build a small, stateless API using **FastAPI** (Python) or **Node/Express**. Package it in Docker and deploy it behind an Nginx reverse proxy. Nginx should terminate TLS, enforce conservative body-size and connection limits, and forward only the explicitly supported `/api/*` routes.

Suggested endpoints:

- `POST /api/ping`
- `POST /api/packet-loss`
- `POST /api/dns`
- `POST /api/traceroute`
- `POST /api/headers`
- `POST /api/ssl`
- `POST /api/uptime`
- `POST /api/port-check`
- `GET /api/ip`
- `POST /api/ip/geolocation`
- `POST /api/ip/asn`

Return a consistent envelope such as `{ data, error, durationMs, requestId }`. Keep network-provider adapters separate from route handlers so mock implementations and hosted APIs can be swapped cleanly. The frontend tool registry and `ToolExperience` component are already structured around one endpoint per tool.

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
