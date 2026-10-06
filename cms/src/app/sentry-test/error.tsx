'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

/**
 * Segment error boundary.
 *
 * `global-error.tsx` only renders in production builds — in dev the Next.js
 * error overlay replaces it, so its `captureException` never runs. This
 * boundary does run in dev, which is what makes the "Throw browser error"
 * button reportable while developing.
 */
export default function SentryTestError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Something broke</h1>
      <p className="text-sm text-muted-foreground">
        Reported to Sentry. {error.digest ? `Digest ${error.digest}.` : null}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
