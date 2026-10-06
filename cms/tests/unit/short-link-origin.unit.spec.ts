import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { publicOrigin } from '@/utilities/publicOrigin'

const req = (url: string, headers: Record<string, string> = {}) => new NextRequest(url, { headers })

describe('publicOrigin', () => {
  it('uses the forwarded host behind a proxy (Railway)', () => {
    expect(
      publicOrigin(
        req('https://localhost:8080/j/abc', {
          host: 'localhost:8080',
          'x-forwarded-host': 'hogapay.com',
          'x-forwarded-proto': 'https',
        }),
      ),
    ).toBe('https://hogapay.com')
  })

  it('takes the first value when proxies append to the headers', () => {
    expect(
      publicOrigin(
        req('http://internal/j/abc', {
          'x-forwarded-host': 'hogapay.com, internal',
          'x-forwarded-proto': 'https,http',
        }),
      ),
    ).toBe('https://hogapay.com')
  })

  it('falls back to the Host header and the request protocol locally', () => {
    expect(publicOrigin(req('http://localhost:3200/j/abc', { host: 'localhost:3200' }))).toBe(
      'http://localhost:3200',
    )
  })
})
