import { describe, expect, it } from 'vitest'

import { getCreatorVerification, verificationRequiredMessage } from '@/utilities/kyb'

// Populated creators carry all three fields, so no database lookup happens.
const verify = (creator: Record<string, unknown>) =>
  getCreatorVerification({} as any, { id: 'u1', ...creator })

describe('getCreatorVerification', () => {
  it('individuals only need KYC', async () => {
    const v = await verify({ accountType: 'individual', kycStatus: 'verified', kybStatus: 'none' })
    expect(v).toMatchObject({ accountType: 'individual', verified: true, missing: null })
  })

  it('individuals without KYC are not verified', async () => {
    const v = await verify({
      accountType: 'individual',
      kycStatus: 'in_review',
      kybStatus: 'approved',
    })
    expect(v).toMatchObject({ verified: false, missing: 'kyc' })
  })

  it('organizations need KYB as well as the owner KYC', async () => {
    const v = await verify({
      accountType: 'organization',
      kycStatus: 'verified',
      kybStatus: 'in_review',
    })
    expect(v).toMatchObject({ accountType: 'organization', verified: false, missing: 'kyb' })
  })

  it('organizations with KYC and KYB are verified', async () => {
    const v = await verify({
      accountType: 'organization',
      kycStatus: 'verified',
      kybStatus: 'approved',
    })
    expect(v.verified).toBe(true)
  })

  it('organizations without owner KYC report KYC first', async () => {
    const v = await verify({
      accountType: 'organization',
      kycStatus: 'none',
      kybStatus: 'approved',
    })
    expect(v).toMatchObject({ verified: false, missing: 'kyc' })
  })

  it('treats users without an account type as individuals', async () => {
    const v = await verify({ accountType: undefined, kycStatus: 'verified', kybStatus: 'none' })
    expect(v).toMatchObject({ accountType: 'individual', verified: true })
  })
})

describe('verificationRequiredMessage', () => {
  it('names the missing verification and the action', () => {
    expect(verificationRequiredMessage('kyb', 'requesting a payout')).toBe(
      'You must complete business verification (KYB) before requesting a payout.',
    )
    expect(verificationRequiredMessage('kyc')).toContain('identity verification (KYC)')
  })
})
