// Sentry Node.js SDK — loaded from src/instrumentation.ts on the server runtime.
import * as Sentry from '@sentry/nextjs'
import { makeNodeTransport } from '@sentry/nextjs'

import { makeDualTransport, resolveDestinations } from './src/utilities/sentryDualTransport'
import { resolveSentryEnvironment } from './src/utilities/sentryEnvironment'

// `||` rather than `??` — the deploy platforms inject empty strings for unset vars.
const { dsn, secondaryDsn } = resolveDestinations(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  process.env.BETTER_STACK_DSN || process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
)

if (dsn) {
  Sentry.init({
    dsn,
    // Every event is copied to Better Stack when its DSN is configured.
    transport: makeDualTransport(makeNodeTransport, secondaryDsn),
    environment: resolveSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
    sendDefaultPii: false,
  })
}
