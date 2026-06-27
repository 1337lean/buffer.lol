# buffer.lol

A dark, browser-first toolbox for network diagnostics, web checks, and developer utilities.

## Stack

- Next.js App Router with TypeScript
- Central tool registry in `data/tools.ts`
- Reusable cards, layouts, result panels, and dynamic tool routes
- Browser-only JSON, Base64, hashing, UUID, timestamp, and user-agent utilities
- Same-origin API-backed diagnostics for DNS, HTTP headers, TLS certificates, uptime, TCP ports, public IP, IP network, and ASN checks
- Mintlify docs in `docs/`
- Local result history stored in browser local storage

## Development

```bash
npm install
npm run dev
```

Docs preview:

```bash
npm run docs:dev
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

No environment variables are required for local development. Set `NEXT_PUBLIC_DOCS_URL=https://docs.buffer.lol` when the docs subdomain is ready, or to a temporary Mintlify preview URL if you publish the docs before DNS is final.

Production diagnostics support these optional settings:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` enable a shared Redis-backed rate limiter. Without them, local development uses an in-memory fallback.
- `TRUST_PROXY_HEADERS=true` or `TRUSTED_PROXY_PLATFORM=vercel|netlify|cloudflare` allows `my-ip` and rate limiting to trust proxy IP headers. Header precedence is `cf-connecting-ip`, then `x-real-ip`, then the first `x-forwarded-for` value.
- `ENABLE_WORKER_TOOLS=true`, `DIAGNOSTICS_WORKER_URL`, and optional `DIAGNOSTICS_WORKER_TOKEN` proxy ping, packet-loss, and traceroute through the same `/api/tools/[slug]` public API shape.
- `DIAGNOSTICS_MAX_CONCURRENCY` caps live diagnostics work per instance.

## Routes

Public:

- `/`
- `/tools/[slug]`
- `/privacy`
- `/terms`

API:

- `POST /api/tools/[slug]`

## Backend work

Most network/IP tools now use `POST /api/tools/[slug]` with a `{ "input": "..." }` JSON body and return `{ data, error, durationMs, requestId }`. The API rate limits by client and target, rejects cross-origin POSTs, caps request bodies, blocks private/reserved outbound targets, deduplicates identical in-flight work, and caches DNS, RDAP, and ASN results briefly where safe.

The shared API route also includes handlers for RDAP domain lookups, redirect checks, and robots/sitemap checks. Ping, packet loss, and traceroute still need a separate container or VM worker because ICMP and traceroute are not reliable in serverless runtimes; when the worker flag and URL are configured, `/api/tools/[slug]` proxies those tools internally and keeps the public response envelope stable.

## Docs

The existing Mintlify project lives in `docs/` and should describe buffer.lol as a diagnostics toolbox.
