# buffer.lol

Media diagnostics workspace for HLS and DASH URL checks, stream buffering risk, video latency, CDN response timing, and report history.

## Stack

- Next.js App Router with TypeScript
- Supabase Auth
- Postgres with Drizzle ORM
- Server-side diagnostic worker path for HLS/DASH probes
- Authenticated workspace, team onboarding, invite management, and admin views

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
- `QSTASH_URL`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `QSTASH_PUBLISH_URL`
- `SENTRY_DSN`
- `POSTHOG_KEY`
- `POSTHOG_HOST`
- `EMAIL_PROVIDER`
- `MUX_WEBHOOK_SECRET`

## Database

The initial migration is in `lib/db/migrations/0000_initial.sql`.

```bash
npm run db:setup
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

Onboarding:

- `/onboarding/team`

Workspace:

- `/app`
- `/app/probes`
- `/app/probes/new`
- `/app/probes/[id]`
- `/app/settings/team`
- `/app/settings/team/invites`

API:

- `/api/teams`
- `/api/teams/current`
- `/api/team-members`
- `/api/team-members/[userId]`
- `/api/team-invites`
- `/api/team-invites/redeem`
- `/api/workers/probes`

Admin:

- `/admin`
- `/admin/waitlist`
- `/admin/probes`
- `/admin/users`

Admin access is controlled by `ADMIN_EMAILS`.

## Diagnostics

Probe creation validates submitted URLs, blocks local/private/link-local network targets, stores a queued probe, and processes the probe with the default inline worker. The worker fetches manifests, samples a small number of media URLs with range requests, stores events/metrics, and generates a report.

Set `QUEUE_PROVIDER` later to route jobs to an external queue. Until then, the default inline provider is useful for validation and small deployments.

Local development:

```bash
QUEUE_PROVIDER=inline
```

Production:

```bash
QUEUE_PROVIDER=qstash
QUEUE_WEBHOOK_URL=https://your-domain.com/api/workers/probes
QSTASH_URL=https://qstash-us-east-1.upstash.io
QSTASH_TOKEN=your-upstash-qstash-token
WORKER_SECRET=replace-with-a-long-random-secret
```

The worker accepts `POST /api/workers/probes` with `Authorization: Bearer <WORKER_SECRET>` and an optional JSON body of `{ "probeId": "..." }`. If no `probeId` is provided, it processes the oldest queued probe, which also makes it suitable for a scheduled job when `QUEUE_PROVIDER=database`.

For QStash, `QUEUE_WEBHOOK_URL` is your deployed worker URL. The app publishes messages to `${QSTASH_URL}/v2/publish/<QUEUE_WEBHOOK_URL>` with `QSTASH_TOKEN`. If you copied a full Upstash publish URL from the dashboard, put it in `QSTASH_PUBLISH_URL` instead of `QUEUE_WEBHOOK_URL`.
