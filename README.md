# buffer.lol

Media diagnostics workspace for HLS and DASH URL checks, stream buffering risk, video latency, CDN response timing, and report history.

## Stack

- Next.js App Router with TypeScript
- Supabase Auth
- Postgres with Drizzle ORM
- Server-side diagnostic worker path for HLS/DASH probes
- Authenticated workspace and admin views

## Development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

## Environment

Copy `.env.example` and fill in Supabase/Postgres values:

```bash
cp .env.example .env.local
```

Required for full runtime behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `QUEUE_PROVIDER`
- `WORKER_SECRET`
- `SENTRY_DSN`
- `POSTHOG_KEY`
- `POSTHOG_HOST`
- `EMAIL_PROVIDER`
- `MUX_WEBHOOK_SECRET`

## Database

The initial migration is in `lib/db/migrations/0000_initial.sql`.

```bash
npm run db:migrate
```

## Routes

Public:

- `/`
- `/privacy`
- `/terms`

Auth:

- `/login`
- `/signup`
- `/logout`

Workspace:

- `/app`
- `/app/probes`
- `/app/probes/new`
- `/app/probes/[id]`
- `/app/settings/team`

Admin:

- `/admin`
- `/admin/waitlist`
- `/admin/probes`
- `/admin/users`

Admin access is controlled by `ADMIN_EMAILS`.

## Diagnostics

Probe creation validates submitted URLs, blocks local/private/link-local network targets, stores a queued probe, and processes the probe with the default inline worker. The worker fetches manifests, samples a small number of media URLs with range requests, stores events/metrics, and generates a report.

Set `QUEUE_PROVIDER` later to route jobs to an external queue. Until then, the default inline provider is useful for validation and small deployments.
