import { createTransport } from '@sentry/nextjs'

import { cleanEnvValue } from './sentryEnvironment'

/**
 * Sends every Sentry envelope to two destinations.
 *
 * Better Stack exposes a Sentry-compatible ingest endpoint, so one SDK can feed
 * both it and Sentry. This is done at the transport layer rather than by
 * capturing twice, which means everything the SDK reports automatically —
 * unhandled browser errors, `onRequestError`, the Payload `afterError` hook —
 * reaches both without any call site knowing about it, and `Sentry.flush()`
 * waits for both before a serverless function freezes.
 */

/**
 * Builds a DSN's envelope ingest URL with auth in the query string, which is
 * the same shape the SDK derives internally. Verified against Better Stack.
 */
export function envelopeEndpointFromDsn(dsn: string): string | undefined {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.replace(/^\//, '')

    if (!url.username || !projectId) {
      return undefined
    }

    return `${url.protocol}//${url.host}/api/${projectId}/envelope/?sentry_key=${url.username}&sentry_version=7`
  } catch {
    return undefined
  }
}

/**
 * Picks which DSN the SDK initialises with and which one gets the copy.
 *
 * If only one is configured it becomes the sole destination, so a missing
 * Better Stack DSN degrades to plain Sentry rather than reporting nothing.
 */
export function resolveDestinations(
  sentryDsn?: string,
  betterStackDsn?: string,
): { dsn?: string; secondaryDsn?: string } {
  const primary = cleanEnvValue(sentryDsn)
  const secondary = cleanEnvValue(betterStackDsn)

  if (primary && secondary && primary !== secondary) {
    return { dsn: primary, secondaryDsn: secondary }
  }

  return { dsn: primary || secondary }
}

// The envelope header names its destination. Each copy needs its own, otherwise
// Better Stack receives an envelope addressed to the Sentry project.
type EnvelopeLike = [Record<string, unknown>, unknown]

const withDsn = (envelope: EnvelopeLike, dsn: string): EnvelopeLike => [
  { ...envelope[0], dsn },
  envelope[1],
]

/*
 * `@sentry/nextjs` does not re-export the transport types and `@sentry/core` is
 * not a direct dependency, so the base factory stays generic and is handed back
 * as the same type it arrived as. That keeps each runtime's own factory
 * (`makeFetchTransport`, `makeNodeTransport`, `makeEdgeFetchTransport`) exact at
 * the call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTransportFactory = (options: any) => any

export function makeDualTransport<Factory extends AnyTransportFactory>(
  createBaseTransport: Factory,
  secondaryDsn?: string,
): Factory {
  const secondaryUrl = secondaryDsn ? envelopeEndpointFromDsn(secondaryDsn) : undefined

  if (!secondaryDsn || !secondaryUrl) {
    return createBaseTransport
  }

  const dualTransport = (options: Parameters<Factory>[0]) => {
    const primary = createBaseTransport(options)

    // Deliberately not routed through `tunnelRoute`: `options.url` is the tunnel
    // when one is configured, and that rewrite only matches Sentry ingest hosts,
    // so a tunnelled Better Stack envelope would 404.
    const secondary = createBaseTransport({ ...options, url: secondaryUrl })

    return {
      send: async (envelope: EnvelopeLike) => {
        const [primaryResult] = await Promise.all([
          primary.send(envelope),
          // A Better Stack failure must never lose the Sentry event.
          secondary.send(withDsn(envelope, secondaryDsn)).catch(() => undefined),
        ])

        return primaryResult
      },
      flush: async (timeout?: number) => {
        const results = await Promise.all([primary.flush(timeout), secondary.flush(timeout)])

        return results.every(Boolean)
      },
    }
  }

  return dualTransport as Factory
}

/**
 * Minimal fetch transport for the edge runtime.
 *
 * The browser and Node builds export ready-made factories, but the edge build
 * only exposes `createTransport`, so the dual transport needs this as its base
 * there. `createTransport` serialises the envelope itself and hands over a body.
 */
export function makeEdgeFetchTransport(
  // `BaseTransportOptions` — the `url`-bearing variant the SDK actually passes —
  // is not re-exported, so it is reconstructed structurally.
  options: Parameters<typeof createTransport>[0] & {
    url: string
    headers?: Record<string, string>
  },
) {
  return createTransport(options, (request) =>
    fetch(options.url, {
      method: 'POST',
      // `serializeEnvelope` yields a string or a Uint8Array; both are valid
      // request bodies at runtime.
      body: request.body as BodyInit,
      headers: options.headers,
    }).then((response) => ({
      statusCode: response.status,
      headers: {
        'x-sentry-rate-limits': response.headers.get('X-Sentry-Rate-Limits'),
        'retry-after': response.headers.get('Retry-After'),
      },
    })),
  )
}
