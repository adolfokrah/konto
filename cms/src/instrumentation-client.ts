// Sentry browser SDK — runs once on the client before the app hydrates.
// Next.js loads this file automatically (App Router client instrumentation).
import * as Sentry from '@sentry/nextjs'
import { makeFetchTransport } from '@sentry/nextjs'

import { makeDualTransport, resolveDestinations } from '@/utilities/sentryDualTransport'
import { resolveSentryEnvironment } from '@/utilities/sentryEnvironment'

const { dsn, secondaryDsn } = resolveDestinations(
  process.env.NEXT_PUBLIC_SENTRY_DSN,
  process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
)

if (dsn) {
  Sentry.init({
    dsn,
    // Every event is copied to Better Stack when its DSN is configured. Sentry
    // still goes through the `/monitoring` tunnel; Better Stack goes direct.
    transport: makeDualTransport(makeFetchTransport, secondaryDsn),
    environment: resolveSentryEnvironment(),

    // Sample every trace in non-production so test events are easy to find.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only log SDK diagnostics locally.
    debug: process.env.NODE_ENV === 'development',

    sendDefaultPii: false,
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
