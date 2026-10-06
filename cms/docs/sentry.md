# Error tracking (CMS)

Error and performance monitoring for the Next.js + Payload app in `cms/`.

Every event goes to **two destinations**: Sentry and Better Stack. Better Stack
exposes a Sentry-compatible ingest endpoint, so a single `@sentry/nextjs` SDK
feeds both — there is no second SDK and no second `captureException` call.

## Environment variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | build + runtime | yes | Sentry browser DSN. Inlined at build time, so it must be present when `next build` runs. |
| `SENTRY_DSN` | runtime | no | Sentry server/edge DSN. Falls back to `NEXT_PUBLIC_SENTRY_DSN`. |
| `NEXT_PUBLIC_BETTER_STACK_DSN` | build + runtime | yes | Better Stack browser DSN. Also inlined at build time. |
| `BETTER_STACK_DSN` | runtime | no | Better Stack server/edge DSN. Falls back to the public one. |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | build | no | Browser environment tag. |
| `SENTRY_ENVIRONMENT` | runtime | no | Server environment tag. |
| `SENTRY_ORG` | build | for source maps | Sentry org slug. |
| `SENTRY_PROJECT` | build | for source maps | Sentry project slug. |
| `SENTRY_AUTH_TOKEN` | build | for source maps | Upload token. When absent, the build skips source-map upload entirely — no failure. |

Values are stripped of surrounding quotes before use, so a quoted DSN or
environment coming out of Infisical still works.

If only one of the two DSNs is set, that one becomes the sole destination — a
missing Better Stack DSN degrades to plain Sentry rather than reporting nothing.
With no DSN at all, `Sentry.init` is skipped and the app behaves exactly as it
did before the integration.

## Environment tag

`src/utilities/sentryEnvironment.ts` is the single source of truth; all three
`Sentry.init` calls and the test page resolve through it, in this order:

1. `SENTRY_ENVIRONMENT`, else `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (only the public
   variable is inlined in the browser)
2. `VERCEL_ENV` / `NEXT_PUBLIC_VERCEL_ENV` — `production`→`production`,
   `preview`→`staging`
3. `development`

`NODE_ENV` is deliberately **not** a fallback: Vercel builds staging with
`NODE_ENV=production`, which would file staging errors under `production`.

Set `SENTRY_ENVIRONMENT` **and** `NEXT_PUBLIC_SENTRY_ENVIRONMENT` per deploy
target. Skipping them is safe — the `VERCEL_ENV` mapping gives the right answer.

## Files

| File | Runtime |
| --- | --- |
| `src/instrumentation-client.ts` | Browser. Also exports `onRouterTransitionStart` for navigation spans. |
| `src/instrumentation.ts` | Server entry. Loads the config below by runtime and exports `onRequestError`. |
| `sentry.server.config.ts` | Node.js (route handlers, server components, server actions). |
| `sentry.edge.config.ts` | Edge (middleware, edge routes). |
| `src/utilities/sentryDualTransport.ts` | Fans every envelope out to both destinations. |
| `src/utilities/sentryEnvironment.ts` | Resolves the `environment` tag. |
| `src/utilities/sentryPayloadError.ts` | Payload `afterError` hook. |
| `src/app/global-error.tsx` | Uncaught React render errors — **production builds only**. |
| `src/app/sentry-test/error.tsx` | Segment boundary; the one that reports in dev. |

## How the dual delivery works

`makeDualTransport` wraps the runtime's own transport factory and returns one
that sends each envelope twice — once to Sentry, once to Better Stack with the
envelope header readdressed. Doing this at the transport layer rather than at the
call site means everything the SDK reports automatically (unhandled browser
errors, `onRequestError`, the Payload hook) reaches both, and `Sentry.flush()`
waits on both before a serverless function freezes.

Two deliberate details:

- **A Better Stack failure never loses the Sentry event.** The copy's rejection
  is swallowed and the primary result is what the SDK sees, so rate-limit
  handling stays intact.
- **Better Stack is not tunnelled.** Sentry browser events go through the
  `/monitoring` tunnel (below); the Better Stack copy goes straight to its
  ingest host, because that rewrite only matches Sentry ingest hosts and would
  404 anything else. `makeMultiplexedTransport` cannot be used for the same
  reason — it forces the tunnel URL onto every destination.

Each runtime supplies its own base transport: `makeFetchTransport` in the
browser, `makeNodeTransport` on the server, and `makeEdgeFetchTransport` (a
minimal fetch transport in `sentryDualTransport.ts`) on the edge, because the
edge build exports no ready-made factory.

## Coverage

- **Browser** — uncaught errors, unhandled rejections, and errors reaching an
  `error.tsx` / `global-error.tsx` boundary.
- **Next.js server** — anything escaping a route handler, server component, or
  server action, via `onRequestError`.
- **Payload** — the `afterError` hook in `src/payload.config.ts`. Payload catches
  its own REST/GraphQL/local-API errors and converts them to responses, so
  `onRequestError` never sees them. The hook skips expected client-side statuses
  (400, 401, 403, 404, 409, 422, 429) to keep the signal clean.

Traces are sampled at 10% in production and 100% everywhere else.

### Uncaught client errors in dev

`global-error.tsx` is rendered only in production builds; in dev the Next.js
error overlay takes its place, so its `captureException` never fires. Any route
that needs uncaught render errors reported while developing needs its own
`error.tsx` boundary — see `src/app/sentry-test/error.tsx`. Seeing the red dev
overlay is not evidence the event was dropped, and it is not evidence it was
sent either.

### Nothing showing up?

1. **Check the project.** A DSN's project id is the number at the end. Ingest
   returns `200` for any valid key/project pair, so a DSN for the wrong project
   looks identical to success from the app's side. Open
   `https://sentry.io/issues/?project=<id>` to see where events actually landed.
2. **Check the environment filter.** Events are tagged as above; if the issue
   stream is filtered to `production`/`staging`, `development` events are hidden
   even though ingestion succeeded.
3. **Read the console.** `debug` is on in dev, so the SDK logs its own activity,
   which distinguishes "never sent" from "sent but filtered".

## Ad blockers

Sentry browser events are tunnelled through `/monitoring` (`tunnelRoute` in
`next.config.js`) so blockers don't drop them. That path is in
`BYPASS_PREFIXES` in `src/middleware.ts` — keep it there.

## Verifying

Open `/sentry-test` (also linked from the dashboard sidebar user menu). The page
shows which DSNs the running server sees and whether the Better Stack copy is
configured for each runtime.

There are two kinds of test on it, and the difference matters:

- **Check every destination** posts one event to each ingest endpoint separately
  and reports what each answered. This is the only way to see a Better Stack
  problem, because the SDK path below reports just the primary's result — the
  Better Stack copy is fanned out at the transport layer and its failures are
  deliberately swallowed so they cannot lose the Sentry event. Look for
  `DestinationCheck` / tag `probe:dashboard-check`.
- **The error buttons** exercise the real SDK path end to end — handled and
  uncaught errors, browser and server. Each one reaches both destinations.

Neither needs a Better-Stack-specific trigger: there is one SDK, and every event
it sends is copied. To confirm receipt, open the Better Stack source the DSN
belongs to alongside the Sentry project.

It deliberately sits outside the `(dashboard)` route group, so it is **public —
no login required**. It reads no app data, but its server actions are publicly
callable and every click costs quota on both providers. Same trade-off as the
existing `/payswitch-test` page. Its path is in `BYPASS_PREFIXES` in
`src/middleware.ts` to keep the locale redirect off it.

Unit coverage for the pieces that silently break lives in
`tests/unit/sentry-dual-transport.unit.spec.ts` and
`tests/unit/sentry-environment.unit.spec.ts` (`pnpm test:unit`).
