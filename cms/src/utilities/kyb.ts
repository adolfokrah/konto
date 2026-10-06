import type { Payload } from 'payload'

/**
 * Resolve a user's cached KYB (business verification) status.
 * Accepts a user id or a populated user object.
 */
export async function getUserKybStatus(payload: Payload, userOrId: any): Promise<string> {
  if (!userOrId) return 'none'
  if (typeof userOrId === 'object' && userOrId.kybStatus) return userOrId.kybStatus as string
  const id = typeof userOrId === 'object' ? userOrId.id : userOrId
  if (!id) return 'none'
  try {
    const user = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return ((user as any)?.kybStatus as string) || 'none'
  } catch {
    return 'none'
  }
}

export type AccountType = 'individual' | 'organization'

export interface CreatorVerification {
  accountType: AccountType
  kycVerified: boolean
  kybApproved: boolean
  /** Can this creator's jars collect contributions and pay out? */
  verified: boolean
  /** The verification still outstanding, if any. */
  missing: 'kyc' | 'kyb' | null
}

/**
 * Verification requirements by account type:
 * - individual: personal KYC only
 * - organization: business KYB only (no personal KYC)
 * Accepts a user id or a populated user object.
 */
export async function getCreatorVerification(
  payload: Payload,
  creatorOrId: any,
): Promise<CreatorVerification> {
  let creator = typeof creatorOrId === 'object' ? creatorOrId : null
  const id = typeof creatorOrId === 'object' ? creatorOrId?.id : creatorOrId
  const hasFields =
    creator && 'kycStatus' in creator && 'kybStatus' in creator && 'accountType' in creator
  if (!hasFields && id) {
    try {
      creator = await payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true })
    } catch {
      creator = null
    }
  }

  const accountType: AccountType =
    creator?.accountType === 'organization' ? 'organization' : 'individual'
  const kycVerified = creator?.kycStatus === 'verified'
  const kybApproved = creator?.kybStatus === 'approved'
  const missing =
    accountType === 'organization' ? (kybApproved ? null : 'kyb') : kycVerified ? null : 'kyc'

  return { accountType, kycVerified, kybApproved, verified: missing === null, missing }
}

/** A jar can only collect contributions / pay out once its creator is verified for their type. */
export async function isCreatorVerified(payload: Payload, creator: any): Promise<boolean> {
  return (await getCreatorVerification(payload, creator)).verified
}

export const CREATOR_NOT_VERIFIED_MESSAGE =
  'This organizer is completing verification and cannot accept contributions yet.'

/** Message for a creator who still has to finish their own verification. */
export function verificationRequiredMessage(
  missing: CreatorVerification['missing'],
  action = 'continuing',
): string {
  return missing === 'kyb'
    ? `You must complete business verification (KYB) before ${action}.`
    : `You must complete identity verification (KYC) before ${action}.`
}
