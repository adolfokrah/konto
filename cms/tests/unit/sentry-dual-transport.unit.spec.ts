import { describe, expect, it, vi } from 'vitest'

import {
  envelopeEndpointFromDsn,
  makeDualTransport,
  resolveDestinations,
} from '@/utilities/sentryDualTransport'

const SENTRY_DSN = 'https://abc123@o296861.ingest.us.sentry.io/4509968117792768'
const BETTER_STACK_DSN =
  'https://tzqxS9GvqhVxpJxa8DVCAb6U@s2678129.eu-central-1a.betterstackdata.com/2678129'

type Envelope = [Record<string, unknown>, unknown]

const envelope = (): Envelope => [{ event_id: 'abc', dsn: SENTRY_DSN }, [['event', {}]]]

/** Records the url each transport instance was built with, plus what it sent. */
const stubFactory = () => {
  const sent: Array<{ url: string; envelope: Envelope }> = []
  const flushed: string[] = []

  const factory = vi.fn((options: { url: string }) => ({
    send: vi.fn(async (env: Envelope) => {
      sent.push({ url: options.url, envelope: env })
      return { statusCode: 200 }
    }),
    flush: vi.fn(async (_timeout?: number) => {
      flushed.push(options.url)
      return true
    }),
  }))

  return { factory, sent, flushed }
}

describe('envelopeEndpointFromDsn', () => {
  it('builds a Sentry ingest url with query auth', () => {
    expect(envelopeEndpointFromDsn(SENTRY_DSN)).toBe(
      'https://o296861.ingest.us.sentry.io/api/4509968117792768/envelope/?sentry_key=abc123&sentry_version=7',
    )
  })

  it('builds the same shape for a Better Stack dsn', () => {
    expect(envelopeEndpointFromDsn(BETTER_STACK_DSN)).toBe(
      'https://s2678129.eu-central-1a.betterstackdata.com/api/2678129/envelope/?sentry_key=tzqxS9GvqhVxpJxa8DVCAb6U&sentry_version=7',
    )
  })

  it.each([
    ['not a url', 'nonsense'],
    ['missing public key', 'https://o296861.ingest.us.sentry.io/123'],
    ['missing project id', 'https://abc123@o296861.ingest.us.sentry.io'],
  ])('returns undefined for %s', (_label, dsn) => {
    expect(envelopeEndpointFromDsn(dsn)).toBeUndefined()
  })
})

describe('resolveDestinations', () => {
  it('pairs both destinations when both are configured', () => {
    expect(resolveDestinations(SENTRY_DSN, BETTER_STACK_DSN)).toEqual({
      dsn: SENTRY_DSN,
      secondaryDsn: BETTER_STACK_DSN,
    })
  })

  it('strips quotes injected by the deploy platform', () => {
    expect(resolveDestinations(`'${SENTRY_DSN}'`, `"${BETTER_STACK_DSN}"`)).toEqual({
      dsn: SENTRY_DSN,
      secondaryDsn: BETTER_STACK_DSN,
    })
  })

  it('falls back to Better Stack alone when Sentry is unset', () => {
    expect(resolveDestinations(undefined, BETTER_STACK_DSN)).toEqual({ dsn: BETTER_STACK_DSN })
  })

  it('does not duplicate when both vars hold the same dsn', () => {
    expect(resolveDestinations(SENTRY_DSN, SENTRY_DSN)).toEqual({ dsn: SENTRY_DSN })
  })

  it('treats empty strings as unset', () => {
    expect(resolveDestinations('', '   ')).toEqual({ dsn: undefined })
  })
})

describe('makeDualTransport', () => {
  it('sends each envelope to both destinations', async () => {
    const { factory, sent } = stubFactory()

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })
    await transport.send(envelope())

    expect(sent).toHaveLength(2)
    expect(sent[0].url).toBe('https://primary/tunnel')
    expect(sent[1].url).toBe(envelopeEndpointFromDsn(BETTER_STACK_DSN))
  })

  it('readdresses the copy so Better Stack is not sent a Sentry-addressed envelope', async () => {
    const { factory, sent } = stubFactory()

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })
    await transport.send(envelope())

    expect(sent[0].envelope[0].dsn).toBe(SENTRY_DSN)
    expect(sent[1].envelope[0].dsn).toBe(BETTER_STACK_DSN)
    // The event id must survive on the copy.
    expect(sent[1].envelope[0].event_id).toBe('abc')
  })

  it('keeps the primary result so the SDK still sees rate limits', async () => {
    const { factory } = stubFactory()

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })

    await expect(transport.send(envelope())).resolves.toEqual({ statusCode: 200 })
  })

  it('does not lose the Sentry event when Better Stack fails', async () => {
    const factory = vi.fn((options: { url: string }) => ({
      send: vi.fn(async (_envelope: Envelope) => {
        if (options.url.includes('betterstackdata')) {
          throw new Error('better stack is down')
        }
        return { statusCode: 200 }
      }),
      flush: vi.fn(async (_timeout?: number) => true),
    }))

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })

    await expect(transport.send(envelope())).resolves.toEqual({ statusCode: 200 })
  })

  it('flushes both destinations so nothing is lost when a function freezes', async () => {
    const { factory, flushed } = stubFactory()

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })
    await expect(transport.flush(2000)).resolves.toBe(true)

    expect(flushed).toEqual(['https://primary/tunnel', envelopeEndpointFromDsn(BETTER_STACK_DSN)])
  })

  it('reports an unflushed secondary as a failed flush', async () => {
    const factory = vi.fn((options: { url: string }) => ({
      send: vi.fn(async (_envelope: Envelope) => ({ statusCode: 200 })),
      flush: vi.fn(async (_timeout?: number) => !options.url.includes('betterstackdata')),
    }))

    const transport = makeDualTransport(
      factory,
      BETTER_STACK_DSN,
    )({ url: 'https://primary/tunnel' })

    await expect(transport.flush(2000)).resolves.toBe(false)
  })

  it('passes the base factory straight through with no secondary dsn', () => {
    const { factory } = stubFactory()

    expect(makeDualTransport(factory, undefined)).toBe(factory)
  })

  it('passes through rather than half-configuring on an unparseable secondary dsn', () => {
    const { factory } = stubFactory()

    expect(makeDualTransport(factory, 'nonsense')).toBe(factory)
  })
})
