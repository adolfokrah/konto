import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { resolveShortLink } from '@collections/Jars/endpoints/resolve-short-link'

describe('GET /api/jars/short/:code', () => {
  let payload: Payload
  let creator: any
  let jar: any

  const call = (code: string, username?: string) =>
    resolveShortLink({
      payload,
      routeParams: { code },
      searchParams: new URLSearchParams(username ? { username } : {}),
    } as any)

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearAllCollections(payload)
    creator = await payload.create({
      collection: 'users',
      data: {
        email: `short-${Date.now()}@test.hoga`,
        password: 'password123',
        firstName: 'Short',
        lastName: 'Link',
        username: `shortlink${Date.now()}`.slice(0, 30),
        phoneNumber: `+2335${Math.floor(1e7 + Math.random() * 8.9e7)}`,
        country: 'gh',
        kycStatus: 'verified',
      } as any,
    })
    const account = await payload.create({
      collection: 'withdrawal-accounts',
      data: {
        user: creator.id,
        type: 'mobile-money',
        provider: 'mtn',
        accountNumber: '0240000077',
        accountHolder: 'Short Link',
        isDefault: true,
      } as any,
      overrideAccess: true,
    })
    jar = await payload.create({
      collection: 'jars',
      data: {
        name: 'home coming',
        currency: 'GHS',
        creator: creator.id,
        withdrawalAccount: account.id,
        status: 'open',
        isActive: true,
      } as any,
      overrideAccess: true,
    })
  })

  it('resolves a code to its jar', async () => {
    const res = await call(jar.shortCode)
    expect(res.status).toBe(200)
    const { data } = await res.json()
    expect(data).toEqual({ jarId: jar.id, name: 'home coming', collectorId: null })
  })

  it('resolves the collector from the username (case-insensitive)', async () => {
    const res = await call(jar.shortCode, creator.username.toUpperCase())
    expect((await res.json()).data.collectorId).toBe(creator.id)
  })

  it('ignores an unknown username', async () => {
    const res = await call(jar.shortCode, 'nobody_here')
    expect((await res.json()).data.collectorId).toBeNull()
  })

  it('404s for an unknown code', async () => {
    expect((await call('zzzzzz')).status).toBe(404)
  })
})
