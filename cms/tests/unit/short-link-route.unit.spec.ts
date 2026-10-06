import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from '@/app/(pay)/j/[code]/[[...username]]/route'

const visit = (path: string, username?: string) =>
  GET(new NextRequest(`https://hogapay.com${path}`, { headers: { host: 'hogapay.com' } }), {
    params: Promise.resolve({ code: 'abc123', ...(username ? { username: [username] } : {}) }),
  })

describe('/j/<code> route', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('looks the code up through the API and redirects to the pay page', async () => {
    const fetchMock = vi.fn(async (_url: URL | string) =>
      Response.json({ data: { jarId: 'jar1', name: 'home coming', collectorId: 'u9' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    process.env.NEXT_PUBLIC_API_URL = 'https://api.hoga.test/api'

    const res = await visit('/j/abc123/ama?utm_source=wa', 'ama')

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://api.hoga.test/api/jars/short/abc123?username=ama',
    )
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'https://hogapay.com/pay/jar1/home-coming?utm_source=wa&collectorId=u9',
    )
  })

  it('sends unknown codes to the home page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 404 })),
    )
    const res = await visit('/j/abc123')
    expect(res.headers.get('location')).toBe('https://hogapay.com/')
  })
})
