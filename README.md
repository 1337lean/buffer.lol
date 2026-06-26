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

## Routes

Public:

- `/`
- `/tools/[slug]`
- `/privacy`
- `/terms`

API:

- `POST /api/tools/[slug]`

## Backend work

Most network/IP tools now use `POST /api/tools/[slug]` with a `{ "input": "..." }` JSON body and return `{ data, error, durationMs, requestId }`. The committed UI exposes DNS lookup, HTTP headers, SSL checker, uptime, port checker, public IP, IP geolocation/network details, and ASN lookup through that route.

The shared API route also includes handlers for RDAP domain lookups, redirect checks, and robots/sitemap checks so those pages can be enabled when their tool registry entries land. Ping, packet loss, and traceroute still need a separate container or VM worker because ICMP and traceroute are not reliable in serverless runtimes.

## Docs

The existing Mintlify project lives in `docs/` and should describe buffer.lol as a diagnostics toolbox.
