// This file configures the initialization of Sentry for client-side bundles.
// With Next.js, we need this to properly capture client and server errors.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://625119fe2561ac059d226347b34a906d@o296861.ingest.us.sentry.io/4509968117792768",

  // Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Disable session replay to avoid multiple instance errors
  // You can re-enable this later if needed, but ensure it's only initialized once
  integrations: [
    // Removed replayIntegration to fix "Multiple Sentry Session Replay instances" error
  ],
});
