import { afterEach, describe, expect, it, vi } from 'vitest'

import Chango, { ChangoError } from '@/utilities/chango'

/**
 * Chango wraps every response in `{ response_code, response_message, data }` and reports
 * failures with HTTP 200, so these lock in that we judge success by `response_code`.
 */
const client = new Chango({
  gatewayKey: 'gw',
  apiKey: 'key',
  transflowId: 'tf',
  merchantProductId: 'mp',
  baseUrl: 'https://chango.test/',
})

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Chango client', () => {
  it('sends the auth headers and unwraps data on success', async () => {
    const fetchMock = mockFetch(200, {
      response_code: '200',
      response_message: 'Successfully retrieved group campaigns',
      data: { count: 1, data: [{ campaignId: 'c1' }], total_pages: 1, current_page: 1 },
    })

    const page = await client.getGroupCampaigns('g1')

    expect(page.data[0].campaignId).toBe('c1')
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://chango.test/api/v1/thirdParty/groups/campaigns?groupId=g1&page=1',
    )
    expect(init.headers).toMatchObject({
      'x-api-key': 'gw',
      'api-key': 'key',
      'transflow-id': 'tf',
      merchantProductId: 'mp',
    })
  })

  it('treats a failure response_code inside HTTP 200 as an error', async () => {
    mockFetch(200, { response_code: '400', response_message: 'campaignId is required', data: [] })

    await expect(client.listContributions('')).rejects.toMatchObject({
      name: 'ChangoError',
      message: 'campaignId is required',
      responseCode: '400',
    })
  })

  it('surfaces gateway rejections that have no envelope', async () => {
    mockFetch(403, { message: 'Missing Authentication Token' })

    const error = await client.listContributions('c1').catch((e) => e)
    expect(error).toBeInstanceOf(ChangoError)
    expect(error.message).toContain('Missing Authentication Token')
    expect(error.responseCode).toBe(403)
  })

  it('posts pagination as record offsets', async () => {
    const fetchMock = mockFetch(200, { response_code: '200', response_message: 'ok', data: {} })

    await client.listContributions('c1', { offset: 10, pageSize: 10 })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      campaignId: 'c1',
      offset: 10,
      pageSize: 10,
    })
  })
})
