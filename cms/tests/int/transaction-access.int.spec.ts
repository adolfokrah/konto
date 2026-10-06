import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

/**
 * Transactions access rules, exercised through the local API with overrideAccess: false (the
 * checks the REST API applies to app requests).
 */
describe('Transactions access control', () => {
  let payload: Payload
  let creator: any
  let stranger: any
  let jar: any

  const makeUser = (n: string) =>
    payload.create({
      collection: 'users',
      data: {
        email: `${n}-${Date.now()}-${Math.random()}@test.hoga`,
        password: 'password123',
        firstName: n,
        lastName: 'Test',
        username: `${n}${Date.now()}`.slice(0, 30),
        phoneNumber: `+2335${Math.floor(1e7 + Math.random() * 8.9e7)}`,
        country: 'gh',
        kycStatus: 'verified',
        kybStatus: 'approved',
        role: 'user',
      } as any,
    })

  const cashContribution = (overrides: Record<string, unknown> = {}) => ({
    jar: jar.id,
    contributor: 'Cash Giver',
    contributorPhoneNumber: '0240000000',
    paymentMethod: 'cash',
    amountContributed: 50,
    type: 'contribution',
    ...overrides,
  })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearAllCollections(payload)
    creator = await makeUser('creator')
    stranger = await makeUser('stranger')
    const account = await payload.create({
      collection: 'withdrawal-accounts',
      data: {
        user: creator.id,
        type: 'mobile-money',
        provider: 'mtn',
        accountNumber: '0240000001',
        accountHolder: 'Creator Test',
        isDefault: true,
      } as any,
      overrideAccess: true,
    })
    jar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Access Test Jar',
        currency: 'GHS',
        creator: creator.id,
        withdrawalAccount: account.id,
        status: 'open',
        isActive: true,
      } as any,
      overrideAccess: true,
    })
  })

  it('lets the jar creator record a contribution', async () => {
    const tx = await payload.create({
      collection: 'transactions',
      data: { ...cashContribution(), collector: creator.id } as any,
      user: creator,
      overrideAccess: false,
    })
    expect(tx.id).toBeTruthy()
  })

  it("rejects contributions to someone else's jar", async () => {
    await expect(
      payload.create({
        collection: 'transactions',
        data: { ...cashContribution(), collector: stranger.id } as any,
        user: stranger,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('rejects payouts created directly', async () => {
    await expect(
      payload.create({
        collection: 'transactions',
        data: {
          ...cashContribution({
            type: 'payout',
            amountContributed: -50,
            paymentMethod: 'mobile-money',
          }),
          collector: creator.id,
        } as any,
        user: creator,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('does not let app users change a payment status', async () => {
    const pending = await payload.create({
      collection: 'transactions',
      data: {
        ...cashContribution({ paymentMethod: 'mobile-money', mobileMoneyProvider: 'mtn' }),
        collector: creator.id,
      } as any,
    })
    expect(pending.paymentStatus).toBe('pending')

    await expect(
      payload.update({
        collection: 'transactions',
        id: pending.id,
        data: { paymentStatus: 'completed' } as any,
        user: creator,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    const after = await payload.findByID({ collection: 'transactions', id: pending.id })
    expect(after.paymentStatus).toBe('pending')
  })
})
