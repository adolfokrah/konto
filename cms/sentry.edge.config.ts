// Sentry SDK for the edge runtime (middleware, edge routes).
import * as Sentry from '@sentry/nextjs'

import {
  makeDualTransport,
  makeEdgeFetchTransport,
  resolveDestinations,
} from './src/utilities/sentryDualTransport'
import { resolveSentryEnvironment } from './src/utilities/sentryEnvironment'

// `||` rather than `??` — the deploy platforms inject empty strings for unset vars.
const { dsn, secondaryDsn } = resolveDestinations(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  process.env.BETTER_STACK_DSN || process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
)

if (dsn) {
  Sentry.init({
    dsn,
    // The edge build exports no ready-made transport factory, so the dual
    // transport is built on a minimal fetch one.
    transport: makeDualTransport(makeEdgeFetchTransport, secondaryDsn),
    environment: resolveSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
    sendDefaultPii: false,
  })
}
