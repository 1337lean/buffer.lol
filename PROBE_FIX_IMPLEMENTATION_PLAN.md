# Probe Fix Implementation Plan

## Context

The project has two separate probe experiences:

- `/` landing page: simulated probe UI driven by `app/page.tsx` plus `public/app.js`.
- `/app/probes/new`: real authenticated probe creation path using `components/probes/NewProbeForm.tsx`, `app/api/probes/route.ts`, `lib/queue/enqueue-probe.ts`, and `workers/probe-worker.ts`.

Recent changes already added:

- `QUEUE_PROVIDER=qstash` support in `lib/queue/enqueue-probe.ts`.
- `POST /api/workers/probes` in `app/api/workers/probes/route.ts`.
- QStash env docs in `.env.example` and `README.md`.
- Local `.env.local` has `QUEUE_PROVIDER=inline` for local testing.
- Main page button text was changed in `app/page.tsx` from `Run probe` to `Simulate probe`.
- The reset text in `public/app.js` was changed to `Simulate probe`.
- Real probe default URL was changed in `components/probes/NewProbeForm.tsx` to Apple’s public HLS sample:
  `https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8`

Checks already run after those edits:

```bash
npm run typecheck
npm run lint
```

Both passed.

## Current Problems

1. On the `/` landing-page simulation, the submit button still resets to `Run probe` after the simulation completes.
2. On `/app/probes/new`, submitting the real probe still shows `Could not queue probe.` even with `QUEUE_PROVIDER=inline`.

## Files To Inspect First

```text
app/page.tsx
public/app.js
components/landing/LandingEnhancements.tsx
components/probes/NewProbeForm.tsx
app/api/probes/route.ts
lib/queue/enqueue-probe.ts
workers/probe-worker.ts
lib/probes/validate-url.ts
lib/probes/safe-fetch.ts
```

Also search for stale labels and fake URLs:

```bash
rg -n "Run probe|Simulate probe|demo\\.buffer\\.lol|Could not queue probe" app components public archive
```

At the time of this handoff, `rg` still found:

```text
archive/legacy-static/app.js:356:        if (label) label.textContent = 'Run probe';
archive/legacy-static/index.html:142:            <span>Run probe</span>
public/app.js:697:      url: 'https://demo.buffer.lol/live/master.m3u8',
public/app.js:708:      url: 'https://demo.buffer.lol/vod/manifest.mpd',
```

The archive files should not affect the Next app unless they are being served separately, but verify the user is not viewing archived/static output.

## Fix Plan: Landing Simulation Button

1. Verify what script is actually loaded in the browser.
   - Start the app with `npm run dev`.
   - Open `/`.
   - Use DevTools or Playwright to inspect the button text before submit, during submit, and after completion.
   - Confirm whether the loaded JavaScript contains `Simulate probe` or stale `Run probe`.

2. Check whether `public/app.js` is being browser-cached.
   - Hard refresh.
   - In dev, restart `npm run dev`.
   - If needed, add a temporary console marker in `public/app.js` to prove the edited file is loaded.

3. Replace all landing-page simulated probe labels with a single constant to avoid drift.
   - In `public/app.js`, define:

     ```js
     const SIMULATE_PROBE_LABEL = 'Simulate probe';
     ```

   - Use it for initial/reset label assignment.
   - Search again to ensure `Run probe` does not appear in active landing files.

4. Update related copy if needed.
   - The copy report fallback currently says `Run a sample probe...`; this is less urgent, but for consistency change it to `Simulate a sample probe...`.

5. Do not rely on archive files unless the deployment still serves `archive/legacy-static`.
   - If the user is accidentally opening `archive/legacy-static/index.html`, update those files too or remove that route from the local workflow.

## Fix Plan: `/app/probes/new` Could Not Queue Probe

The client only shows `Could not queue probe.` when `POST /api/probes` throws and returns the generic 500 from the catch block. The next step is to expose/log the actual server-side reason locally.

1. Reproduce from the browser and terminal.
   - Start with:

     ```bash
     npm run dev
     ```

   - Confirm `.env.local` has:

     ```bash
     QUEUE_PROVIDER=inline
     DATABASE_URL=...
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     ```

   - Log in, ensure a workspace/team exists, then submit `/app/probes/new`.
   - Watch the terminal logs for `probe queue request failed`.

2. Temporarily improve local error visibility in `app/api/probes/route.ts`.
   - In the `catch`, include the message only outside production:

     ```ts
     const message = error instanceof Error ? error.message : "Could not queue probe.";
     return NextResponse.json(
       { error: process.env.NODE_ENV === "production" ? "Could not queue probe." : message },
       { status: 500 }
     );
     ```

   - Keep `logError("probe queue request failed", error);`.
   - This should reveal whether the failure is auth, workspace, database, URL validation, insert conflict, worker fetch, report insert, or email.

3. Check the common failure points.
   - Auth/workspace:
     - `getAuthenticatedUser()` may return null.
     - `getCurrentWorkspace(auth.id)` may return null.
     - If the user was created before bootstrapping, `users` or `team_members` rows may be missing.
   - Database schema:
     - Run `npm run db:setup`.
     - Confirm tables exist: `users`, `teams`, `team_members`, `probes`, `probe_events`, `probe_metrics`, `reports`, `rate_limit_buckets`.
   - URL validation/fetch:
     - Apple HLS manifest should return `#EXTM3U`.
     - Local/private URLs are intentionally blocked.
   - Worker failure:
     - Inline mode calls `processProbe(probeId)` inside the API request.
     - Any exception in manifest parsing, segment fetch, metrics insert, report insert, or email will make the request return 500.

4. Make inline mode more user-friendly.
   - A real queue creation should probably return `201` after the probe row is created, even if inline worker processing later fails and marks the probe `error`.
   - Consider changing `enqueueProbe`/`POST /api/probes` so inline worker errors do not mask successful probe creation.
   - One possible approach:
     - In dev inline mode, catch `processProbe(probeId)` errors inside `enqueueProbe`.
     - Let `processProbe`/`finishWithError` mark the probe as `error`.
     - Still return `{ enqueued: true, processedInline: false }` if the probe row exists.
     - Then the client can navigate to `/app/probes/[id]` and show the actual report/error events.

5. Add a small smoke script or test fixture if useful.
   - Create a script that calls `processProbe(probeId)` for an existing queued probe.
   - Or insert a test probe tied to a local test user/team.
   - Keep this script out of production paths unless it is intentionally useful.

## Acceptance Criteria

- `/` button says `Simulate probe` before submit, while running, and after reset.
- No active app code resets the landing-page simulation button to `Run probe`.
- `/app/probes/new` with `QUEUE_PROVIDER=inline` and the Apple HLS URL creates a probe row and navigates to `/app/probes/[id]`.
- The probe detail page shows worker events, metrics, and a report, or a clear worker error report if the target fails.
- `npm run typecheck` passes.
- `npm run lint` passes.

## Notes

- `https://demo.buffer.lol/live/master.m3u8` is not a valid HLS test URL. It returned HTML after redirecting to `https://fakecrime.bio/x0` during local checking.
- The Apple sample URL did return a valid HLS manifest during local checking.
- `.env.local` is intentionally uncommitted. Production hosting must receive the same required env vars manually.
