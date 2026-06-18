# buffer.lol

Browser-based internet speed tester for download speed, upload speed, ping, jitter, and recent local result history.

## Stack

- Next.js App Router with TypeScript
- Browser-side speed test controller in `public/app.js`
- Same-origin speed-test API at `/api/speed-test`
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

During local development, the app's Docs links point at `http://localhost:3333` by default, and the Mintlify navbar's Run test button points back to `http://localhost:3000/#speed-test`.

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
- `/privacy`
- `/terms`

API:

- `GET /api/speed-test?bytes=2097152`
- `POST /api/speed-test`

## Speed Testing

The homepage samples several tiny uncached requests for ping and jitter, downloads larger same-origin byte payloads, then posts a temporary browser-generated payload for upload timing. The endpoint caps generated downloads and accepted uploads at 12MB and does not persist payloads.

## Docs

The Mintlify project lives in `docs/` and is intended for a docs subdomain such as `docs.buffer.lol`. It uses `docs.json`, a short Getting Started section, Concepts, and an API Reference page for `/api/speed-test`.
