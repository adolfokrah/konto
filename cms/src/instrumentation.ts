// Keep Sentry import at module scope (Next.js expects this file) but we guard runtime usage.
import * as Sentry from '@sentry/nextjs'

// Global flag to prevent multiple initializations
let sentryInitialized = false

console.log(process.env.NODE_ENV)

export async function register() {
  // Prevent multiple initializations (can happen during hot reloads)
  if (sentryInitialized) {
    console.log('[sentry] Already initialized, skipping...')
    return
  }

  // Only enable Sentry in production on Vercel to reduce local noise.
  // if (!(process.env.NODE_ENV === 'production' && process.env.VERCEL)) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Explicitly import require-in-the-middle so it gets bundled for Vercel
    // (workaround for MODULE_NOT_FOUND during serverless execution)
    try {
      // @ts-ignore: package has no types; only needed so bundler includes it
      await import('require-in-the-middle')
    } catch (e) {
      // Swallow if missing; Sentry will just have reduced instrumentation
      console.warn('[sentry] optional require-in-the-middle not available', e)
    }
    await import('../sentry.server.config')
    sentryInitialized = true
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
    sentryInitialized = true
  }
}

export const onRequestError = Sentry.captureRequestError
