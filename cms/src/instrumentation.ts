import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Only enable Sentry in production on Vercel
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('../sentry.server.config')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('../sentry.edge.config')
    }
  }
}

export const onRequestError = Sentry.captureRequestError
