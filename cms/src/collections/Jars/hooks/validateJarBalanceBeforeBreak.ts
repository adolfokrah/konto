import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/**
 * Prevents a jar from being set to 'broken' if it has a balance > 0.
 * Balance is calculated from transactions: settled contributions + payouts.
 */
export const validateJarBalanceBeforeBreak: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation !== 'update') return data

  // Only check when status is changing to 'broken'
  if (data?.status !== 'broken' || originalDoc?.status === 'broken') return data

  const jarId = originalDoc?.id
  if (!jarId) return data

  const allTransactions = await req.payload.find({
    collection: 'transactions',
    where: { jar: { equals: jarId } },
    pagination: false,
    select: { amountContributed: true, type: true, isSettled: true, paymentStatus: true },
    overrideAccess: true,
  })

  const settledSum = allTransactions.docs
    .filter(
      (tx: any) =>
        tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
    )
    .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

  const payoutsSum = allTransactions.docs
    .filter(
      (tx: any) =>
        tx.type === 'payout' &&
        (tx.paymentStatus === 'pending' ||
          tx.paymentStatus === 'completed' ||
          tx.paymentStatus === 'awaiting-approval'),
    )
    .reduce((sum: number, tx: any) => sum + (tx.amountContributed || 0), 0)

  const balance = settledSum + payoutsSum

  if (balance > 0) {
    throw new APIError(
      `Cannot break a jar with remaining balance of ${balance.toFixed(2)}. Please withdraw all funds first.`,
      400,
    )
  }

  return data
}
