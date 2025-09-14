// This file configures the initialization of Sentry for client-side bundles.
// With Next.js, we need this to properly capture client and server errors.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Disable session replay to avoid multiple instance errors
  // You can re-enable this later if needed, but ensure it's only initialized once
  integrations: [
    // Removed replayIntegration to fix "Multiple Sentry Session Replay instances" error
  ],
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
})
