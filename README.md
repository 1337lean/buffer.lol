# buffer.lol

A dark, browser-first toolbox for network diagnostics, web checks, and developer utilities.

## Stack

- Next.js App Router with TypeScript
- Central tool registry in `data/tools.ts`
- Reusable cards, layouts, result panels, and dynamic tool routes
- Browser-only JSON, Base64, hashing, UUID, timestamp, and user-agent utilities
- Backend-ready placeholders for network and IP checks
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

- Legacy endpoint retained for future connection-testing work:
- `GET /api/speed-test?bytes=2097152`
- `POST /api/speed-test`

## Backend work

See `BACKEND_PLAN.md` for the proposed API, Docker/Nginx deployment shape, endpoints, and security requirements. Screens marked **Backend required** never claim to return live data.

## Docs

The existing Mintlify project lives in `docs/`. Its legacy speed-test API reference can be refreshed when the new diagnostic API described in `BACKEND_PLAN.md` is implemented.
