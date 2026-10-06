import * as Sentry from '@sentry/nextjs'
import type { AfterErrorHook } from 'payload'

// Client-side mistakes (bad input, missing auth, not found) are expected traffic,
// not defects — reporting them would bury the real failures.
const EXPECTED_STATUSES = new Set([400, 401, 403, 404, 409, 422, 429])

/**
 * Reports Payload-layer errors to Sentry.
 *
 * Next.js `onRequestError` only sees errors that escape a route handler, but
 * Payload catches its own REST/GraphQL/local-API errors and turns them into
 * responses. This hook is the only place those become visible.
 */
export const reportErrorToSentry: AfterErrorHook = ({ collection, error, req }) => {
  // Payload's APIError carries the HTTP status it will respond with.
  const { status } = error as { status?: number }

  if (typeof status === 'number' && EXPECTED_STATUSES.has(status)) {
    return
  }

  Sentry.captureException(error, {
    tags: {
      source: 'payload',
      collection: collection?.slug,
      status,
    },
    extra: {
      url: req?.url,
      method: req?.method,
      userId: req?.user?.id,
    },
  })
}
