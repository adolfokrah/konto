import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { registerUser } from '@collections/Users/endpoints/register-user'
import { grantPreRegistration, phoneKey } from '@/utilities/phoneVerification'

describe('Account types', () => {
  let payload: Payload

  const makeCreatorWithJar = async (n: string, fields: Record<string, unknown>) => {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: `${n}-${Date.now()}-${Math.random()}@test.hoga`,
        password: 'password123',
        firstName: n,
        lastName: 'Test',
        username: `${n}${Date.now()}`.slice(0, 30),
        phoneNumber: `+2335${Math.floor(1e7 + Math.random() * 8.9e7)}`,
        country: 'gh',
        role: 'user',
        ...fields,
      } as any,
    })
    const account = await payload.create({
      collection: 'withdrawal-accounts',
      data: {
        user: user.id,
        type: 'mobile-money',
        provider: 'mtn',
        accountNumber: `024${Math.floor(1e6 + Math.random() * 8.9e6)}`,
        accountHolder: `${n} Test`,
        isDefault: true,
      } as any,
      overrideAccess: true,
    })
    const jar = await payload.create({
      collection: 'jars',
      data: {
        name: `${n} jar`,
        currency: 'GHS',
        creator: user.id,
        withdrawalAccount: account.id,
        status: 'open',
        isActive: true,
      } as any,
      overrideAccess: true,
    })
    return { user, jar }
  }

  const recordCash = (user: any, jar: any) =>
    payload.create({
      collection: 'transactions',
      data: {
        jar: jar.id,
        contributor: 'Cash Giver',
        contributorPhoneNumber: '0240000000',
        paymentMethod: 'cash',
        amountContributed: 20,
        type: 'contribution',
        collector: user.id,
      } as any,
      user,
      overrideAccess: false,
    })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearAllCollections(payload)
  })

  it('lets a KYC-verified individual collect without KYB', async () => {
    const { user, jar } = await makeCreatorWithJar('indie', {
      accountType: 'individual',
      kycStatus: 'verified',
      kybStatus: 'none',
    })
    const tx = await recordCash(user, jar)
    expect(tx.id).toBeTruthy()
  })

  it('blocks an individual who has not passed KYC', async () => {
    const { user, jar } = await makeCreatorWithJar('nokyc', {
      accountType: 'individual',
      kycStatus: 'none',
    })
    await expect(recordCash(user, jar)).rejects.toThrow(/identity verification/)
  })

  it('blocks an organization until KYB is approved', async () => {
    const { user, jar } = await makeCreatorWithJar('org', {
      accountType: 'organization',
      kycStatus: 'verified',
      kybStatus: 'in_review',
    })
    await expect(recordCash(user, jar)).rejects.toThrow(/business verification/)
  })

  it('lets an organization with KYB and owner KYC collect', async () => {
    const { user, jar } = await makeCreatorWithJar('orgok', {
      accountType: 'organization',
      kycStatus: 'verified',
      kybStatus: 'approved',
    })
    const tx = await recordCash(user, jar)
    expect(tx.id).toBeTruthy()
  })

  describe('registration', () => {
    const register = (accountType?: string) => {
      const phoneNumber = `2${Math.floor(1e8 + Math.random() * 8.9e8)}`
      grantPreRegistration(phoneKey('+233', phoneNumber))
      return registerUser({
        payload,
        data: {
          phoneNumber,
          countryCode: '+233',
          country: 'gh',
          firstName: 'Reg',
          lastName: 'Test',
          username: `reg${Date.now()}${Math.floor(Math.random() * 1000)}`,
          ...(accountType !== undefined ? { accountType } : {}),
        },
      } as any)
    }

    it('creates organizations when asked', async () => {
      const res = await register('organization')
      expect(res.status).toBe(201)
      expect((await res.json()).user.accountType).toBe('organization')
    })

    it('defaults to individual (older app versions send no type)', async () => {
      const res = await register()
      expect(res.status).toBe(201)
      expect((await res.json()).user.accountType).toBe('individual')
    })

    it('rejects an unknown account type', async () => {
      const res = await register('company')
      expect(res.status).toBe(400)
    })
  })
})
