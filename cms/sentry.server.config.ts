// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// TypeScript declaration for global variable
declare global {
  var __SENTRY_SERVER_INITIALIZED__: boolean | undefined
}

// Prevent multiple initializations
if (!global.__SENTRY_SERVER_INITIALIZED__) {
  global.__SENTRY_SERVER_INITIALIZED__ = true

  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 0.1, // Reduced from 1 for production

    // Enable logs to be sent to Sentry
    enableLogs: false, // Disabled to reduce overhead

    environment: process.env.SENTRY_ENVIRONMENT,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false, // Enable debug for testing

    // Only enable necessary integrations
    integrations: [Sentry.httpIntegration(), Sentry.nodeContextIntegration()],
  })

  console.log('[Sentry] Server config initialized')
} else {
  console.log('[Sentry] Server already initialized, skipping...')
}
