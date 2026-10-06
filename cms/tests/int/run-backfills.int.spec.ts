import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { runBackfills } from '@/endpoints/run-backfills'

describe('POST /api/run-backfills', () => {
  let payload: Payload
  let admin: any
  let legacyUser: any
  let legacyJar: any

  const call = (user: any, body: Record<string, unknown> = {}) =>
    runBackfills({ payload, user, json: async () => body } as any)

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearAllCollections(payload)

    const makeUser = (n: string, extra: Record<string, unknown> = {}) =>
      payload.create({
        collection: 'users',
        data: {
          email: `${n}-${Date.now()}@test.hoga`,
          password: 'password123',
          firstName: n,
          lastName: 'Test',
          username: `${n}${Date.now()}`.slice(0, 30),
          phoneNumber: `+2335${Math.floor(1e7 + Math.random() * 8.9e7)}`,
          country: 'gh',
          kycStatus: 'verified',
          ...extra,
        } as any,
      })

    admin = await makeUser('admin', { role: 'admin' })
    legacyUser = await makeUser('legacy')
    const account = await payload.create({
      collection: 'withdrawal-accounts',
      data: {
        user: legacyUser.id,
        type: 'mobile-money',
        provider: 'mtn',
        accountNumber: '0240000009',
        accountHolder: 'Legacy Test',
        isDefault: true,
      } as any,
      overrideAccess: true,
    })
    legacyJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Legacy jar',
        currency: 'GHS',
        creator: legacyUser.id,
        withdrawalAccount: account.id,
        status: 'open',
        isActive: true,
      } as any,
      overrideAccess: true,
    })

    // Simulate records created before short codes / account types existed.
    await payload.db.collections.users.updateOne(
      { _id: legacyUser.id },
      { $unset: { accountType: 1 } },
    )
    await payload.db.collections.jars.updateOne({ _id: legacyJar.id }, { $unset: { shortCode: 1 } })
  })

  it('is admin only', async () => {
    expect((await call(legacyUser)).status).toBe(403)
    expect((await call(null)).status).toBe(403)
  })

  it('reports without writing on a dry run', async () => {
    const res = await call(admin, { dryRun: true })
    const body = await res.json()
    expect(body.results.shortCodes.found).toBeGreaterThanOrEqual(1)
    expect(body.results.accountTypes.found).toBeGreaterThanOrEqual(1)
    expect(body.results.shortCodes.updated).toBe(0)
    const jar = await payload.findByID({ collection: 'jars', id: legacyJar.id })
    expect(jar.shortCode).toBeFalsy()
  })

  it('backfills both, then has nothing left to do', async () => {
    const first = await (await call(admin)).json()
    expect(first.results.shortCodes.updated).toBeGreaterThanOrEqual(1)
    expect(first.results.accountTypes.updated).toBeGreaterThanOrEqual(1)

    const jar = await payload.findByID({ collection: 'jars', id: legacyJar.id })
    expect(jar.shortCode).toMatch(/^[a-zA-Z2-9]{6}$/)
    const user = await payload.findByID({ collection: 'users', id: legacyUser.id })
    expect((user as any).accountType).toBe('individual')

    const second = await (await call(admin)).json()
    expect(second.results.shortCodes.found).toBe(0)
    expect(second.results.accountTypes.found).toBe(0)
  })

  it('can run a single backfill and rejects unknown names', async () => {
    const res = await (await call(admin, { only: ['shortCodes'] })).json()
    expect(Object.keys(res.results)).toEqual(['shortCodes'])
    expect((await call(admin, { only: ['nope'] })).status).toBe(400)
  })
})
