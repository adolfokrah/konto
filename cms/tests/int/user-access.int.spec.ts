import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'
import { updateKYC } from '@collections/Users/endpoints/update-kyc'
import { Users } from '@collections/Users'

/**
 * Users access rules, exercised through the local API with overrideAccess: false — the same
 * checks the REST API applies to app requests.
 */
describe('Users access control', () => {
  let payload: Payload
  let alice: any
  let bob: any
  let admin: any

  const makeUser = (n: string, extra: Record<string, unknown> = {}) =>
    payload.create({
      collection: 'users',
      data: {
        email: `${n}-${Date.now()}@test.hoga`,
        password: 'irrelevant-password',
        firstName: n,
        lastName: 'Test',
        username: `${n}${Date.now()}`.slice(0, 30),
        phoneNumber: `54${Math.floor(1e7 + Math.random() * 8.9e7)}`,
        countryCode: '+233',
        country: 'gh',
        ...extra,
      } as any,
    })

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearAllCollections(payload)
    alice = await makeUser('alice')
    bob = await makeUser('bob')
    admin = await makeUser('admin', { role: 'admin' })
  })

  it('does not let a user promote themselves or mark themselves verified', async () => {
    await payload.update({
      collection: 'users',
      id: alice.id,
      data: {
        role: 'admin',
        kycStatus: 'verified',
        kybStatus: 'approved',
        hogapayDiscountPercent: 100,
        firstName: 'Alicia',
      } as any,
      user: alice,
      overrideAccess: false,
    })
    const after = await payload.findByID({ collection: 'users', id: alice.id })
    expect(after.firstName).toBe('Alicia') // allowed field still updates
    expect(after.role).not.toBe('admin')
    expect(after.kycStatus).not.toBe('verified')
    expect((after as any).kybStatus).not.toBe('approved')
    expect((after as any).hogapayDiscountPercent ?? 0).toBe(0)
  })

  it("hides other users' contact details and tokens", async () => {
    const seen = await payload.findByID({
      collection: 'users',
      id: bob.id,
      user: alice,
      overrideAccess: false,
    })
    expect(seen.firstName).toBe('bob')
    expect(seen.email).toBeUndefined()
    expect(seen.phoneNumber).toBeUndefined()
    expect((seen as any).fcmToken).toBeUndefined()
    expect((seen as any).otpCode).toBeUndefined()
  })

  it('still shows users their own details', async () => {
    const me = await payload.findByID({
      collection: 'users',
      id: bob.id,
      user: bob,
      overrideAccess: false,
    })
    expect(me.email).toBe(bob.email)
    expect(me.phoneNumber).toBe(bob.phoneNumber)
  })

  it('refuses anonymous reads and direct creates', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'x@test.hoga', password: 'x', role: 'admin' } as any,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('lets admins change verification fields', async () => {
    await payload.update({
      collection: 'users',
      id: bob.id,
      data: { kycStatus: 'verified' } as any,
      user: admin,
      overrideAccess: false,
    })
    const after = await payload.findByID({ collection: 'users', id: bob.id })
    expect(after.kycStatus).toBe('verified')
  })

  it('only lets admins call update-kyc', async () => {
    const asUser = await updateKYC({
      payload,
      user: alice,
      data: { userId: alice.id, kycStatus: 'verified' },
    } as any)
    expect(asUser.status).toBe(403)

    const anonymous = await updateKYC({
      payload,
      user: null,
      data: { userId: alice.id, kycStatus: 'verified' },
    } as any)
    expect(anonymous.status).toBe(403)
  })

  it('blocks email/password login for app users but not for staff', async () => {
    await expect(
      payload.login({
        collection: 'users',
        data: { email: alice.email, password: 'irrelevant-password' },
      }),
    ).rejects.toThrow()

    // Staff pass the hook (asserted on the hook itself: signing a token needs Node's crypto,
    // which the jsdom test environment doesn't provide).
    const [beforeLogin] = (Users.hooks?.beforeLogin ?? []) as any[]
    expect(beforeLogin({ user: admin, req: { context: {} } })).toBe(admin)
    expect(() => beforeLogin({ user: alice, req: { context: {} } })).toThrow()
    expect(beforeLogin({ user: alice, req: { context: { phoneLogin: true } } })).toBe(alice)
  })

  it('keeps the collaborator search working (name or email query)', async () => {
    const res = await payload.find({
      collection: 'users',
      where: {
        or: [
          { email: { contains: 'bob' } },
          { firstName: { contains: 'bob' } },
          { lastName: { contains: 'bob' } },
        ],
      },
      depth: 1,
      user: alice,
      overrideAccess: false,
    })
    expect(res.docs.some((u: any) => u.id === bob.id)).toBe(true)
    expect(res.docs.find((u: any) => u.id === bob.id)?.email).toBeUndefined()
  })
})
