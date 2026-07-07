import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/**
 * Ensures a jar has a withdrawal account and that it belongs to the jar creator.
 * - On create (via a real user request, not overrideAccess): withdrawalAccount is required.
 * - Whenever set: the account's owner must match the jar creator.
 * Admin/migration flows use overrideAccess and are exempt from the create requirement.
 */
export const validateWithdrawalAccount: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const accountId =
    typeof data?.withdrawalAccount === 'object'
      ? data.withdrawalAccount?.id
      : data?.withdrawalAccount

  // Required on create for real (non-admin) user requests; admin/migration act without a
  // non-admin req.user and are exempt.
  if (operation === 'create' && req.user && (req.user as any).role !== 'admin' && !accountId) {
    throw new APIError('A withdrawal account is required to create a jar', 400)
  }

  if (accountId) {
    const creatorId =
      typeof data?.creator === 'object'
        ? data.creator?.id
        : (data?.creator ??
          (typeof originalDoc?.creator === 'object'
            ? originalDoc?.creator?.id
            : originalDoc?.creator))

    const account = await req.payload
      .findByID({
        collection: 'withdrawal-accounts',
        id: accountId,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)

    if (!account) {
      throw new APIError('Withdrawal account not found', 400)
    }
    const ownerId =
      typeof (account as any).user === 'object' ? (account as any).user?.id : (account as any).user
    if (creatorId && String(ownerId) !== String(creatorId)) {
      throw new APIError('Withdrawal account does not belong to the jar creator', 403)
    }
  }

  return data
}
