'use server'

import * as Sentry from '@sentry/nextjs'
import { randomUUID } from 'crypto'

import { envelopeEndpointFromDsn, resolveDestinations } from '@/utilities/sentryDualTransport'
import { resolveSentryEnvironment } from '@/utilities/sentryEnvironment'

/**
 * Throws on the server so we can confirm server-side errors reach Sentry.
 * Next.js reports this through `onRequestError` in src/instrumentation.ts.
 */
export async function throwServerError() {
  throw new Error('Sentry test: uncaught server action error')
}

export type DestinationCheck = {
  label: string
  host: string
  statusCode: number | null
  ok: boolean
  detail?: string
}

/**
 * Posts one event to each configured destination directly and reports the
 * status of each.
 *
 * The error buttons exercise the SDK, which fans out to both destinations
 * together and only surfaces the primary's result — so a Better Stack outage
 * looks identical to success. This talks to each ingest endpoint on its own,
 * which is what makes "did Better Stack actually take it?" answerable.
 */
export async function checkDestinations(): Promise<DestinationCheck[]> {
  const { dsn, secondaryDsn } = resolveDestinations(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    process.env.BETTER_STACK_DSN || process.env.NEXT_PUBLIC_BETTER_STACK_DSN,
  )

  const targets = [
    { label: 'Sentry', dsn },
    { label: 'Better Stack', dsn: secondaryDsn },
  ].filter((target): target is { label: string; dsn: string } => Boolean(target.dsn))

  if (!targets.length) {
    return []
  }

  return Promise.all(targets.map((target) => sendProbe(target.label, target.dsn)))
}

async function sendProbe(label: string, dsn: string): Promise<DestinationCheck> {
  const url = envelopeEndpointFromDsn(dsn)
  let host = dsn

  try {
    host = new URL(dsn).host
  } catch {
    // Reported as unparseable below.
  }

  if (!url) {
    return { label, host, statusCode: null, ok: false, detail: 'DSN could not be parsed' }
  }

  const eventId = randomUUID().replace(/-/g, '')
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'node',
    level: 'error',
    environment: resolveSentryEnvironment(),
    tags: { probe: 'dashboard-check' },
    exception: {
      values: [
        {
          type: 'DestinationCheck',
          value: `Destination check from the dashboard (${label})`,
          stacktrace: {
            frames: [
              {
                filename: 'app:///src/app/sentry-test/actions.ts',
                function: 'checkDestinations',
                lineno: 1,
                in_app: true,
              },
            ],
          },
        },
      ],
    },
  }

  const body = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn }),
    JSON.stringify({ type: 'event', length: Buffer.byteLength(JSON.stringify(event)) }),
    JSON.stringify(event),
  ].join('\n')

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body: `${body}\n`,
    })

    // Ingest answers 200 for anything it accepts, so a rate-limit header is the
    // only hint that an accepted event will still be discarded.
    const rateLimited = response.headers.get('x-sentry-rate-limits')

    return {
      label,
      host,
      statusCode: response.status,
      ok: response.ok && !rateLimited,
      detail: rateLimited ? `Rate limited: ${rateLimited}` : undefined,
    }
  } catch (error) {
    return {
      label,
      host,
      statusCode: null,
      ok: false,
      detail: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

/**
 * Reports a handled server-side error without breaking the request.
 */
export async function captureServerError() {
  const eventId = Sentry.captureException(new Error('Sentry test: captured server action error'))

  // Make sure the event leaves the process before a serverless function freezes.
  await Sentry.flush(2000)

  return eventId
}
