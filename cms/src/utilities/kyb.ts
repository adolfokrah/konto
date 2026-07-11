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

/** A jar can only collect contributions / pay out once its creator is KYB-approved. */
export async function isCreatorKybApproved(payload: Payload, creator: any): Promise<boolean> {
  return (await getUserKybStatus(payload, creator)) === 'approved'
}

export const KYB_NOT_APPROVED_MESSAGE =
  'This organization is completing business verification and cannot accept contributions yet.'
