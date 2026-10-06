import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resolveSentryEnvironment } from '@/utilities/sentryEnvironment'

const VARS = [
  'SENTRY_ENVIRONMENT',
  'NEXT_PUBLIC_SENTRY_ENVIRONMENT',
  'VERCEL_ENV',
  'NEXT_PUBLIC_VERCEL_ENV',
] as const

describe('resolveSentryEnvironment', () => {
  const original: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of VARS) {
      original[key] = process.env[key]
      delete process.env[key]
    }
  })

  afterEach(() => {
    for (const key of VARS) {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    }
  })

  it('prefers the explicit server setting', () => {
    process.env.SENTRY_ENVIRONMENT = 'staging'
    process.env.VERCEL_ENV = 'production'

    expect(resolveSentryEnvironment()).toBe('staging')
  })

  it('falls back to the public setting when only that is inlined', () => {
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = 'staging'

    expect(resolveSentryEnvironment()).toBe('staging')
  })

  it('strips quotes injected by the deploy platform', () => {
    process.env.SENTRY_ENVIRONMENT = "'staging'"

    expect(resolveSentryEnvironment()).toBe('staging')
  })

  it('ignores empty strings rather than reporting an empty environment', () => {
    process.env.SENTRY_ENVIRONMENT = ''
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = '   '

    expect(resolveSentryEnvironment()).toBe('development')
  })

  // The regression that mattered: staging builds run with NODE_ENV=production,
  // so a NODE_ENV fallback filed staging errors under production. The resolver
  // never consults NODE_ENV, which is what makes this hold.
  it('maps a Vercel preview deploy to staging, not production', () => {
    process.env.VERCEL_ENV = 'preview'

    expect(resolveSentryEnvironment()).toBe('staging')
  })

  it('maps a Vercel production deploy to production', () => {
    process.env.VERCEL_ENV = 'production'

    expect(resolveSentryEnvironment()).toBe('production')
  })

  it('reads the public Vercel variable on the browser', () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview'

    expect(resolveSentryEnvironment()).toBe('staging')
  })

  it('passes through an unrecognised Vercel value', () => {
    process.env.VERCEL_ENV = 'qa'

    expect(resolveSentryEnvironment()).toBe('qa')
  })

  it('defaults to development with nothing set', () => {
    expect(resolveSentryEnvironment()).toBe('development')
  })
})
