import type { BasePayload } from 'payload'

/**
 * Calculates the net available balance for a jar.
 *
 * Balance = settled mobile-money contributions (isSettled + completed)
 *         + all non-failed payouts (pending | awaiting-approval | completed, stored as negative amounts)
 */
export async function getJarBalance(
  payload: BasePayload,
  jarId: string,
): Promise<{ balance: number; settledContributions: any[] }> {
  const allTransactions = await payload.find({
    collection: 'transactions',
    where: {
      and: [
        { jar: { equals: jarId } },
        {
          or: [
            {
              type: { equals: 'contribution' },
              paymentMethod: { equals: 'mobile-money' },
              paymentStatus: { equals: 'completed' },
              isSettled: { equals: true },
            },
            {
              type: { equals: 'payout' },
              paymentStatus: { in: ['pending', 'completed', 'awaiting-approval'] },
            },
          ],
        },
      ],
    },
    pagination: false,
    select: {
      amountContributed: true,
      type: true,
      createdAt: true,
    },
    overrideAccess: true,
  })

  const settledContributions = allTransactions.docs.filter((tx: any) => tx.type === 'contribution')

  const settledSum = settledContributions.reduce(
    (sum: number, tx: any) => sum + (tx.amountContributed ?? 0),
    0,
  )

  const payoutsSum = allTransactions.docs
    .filter((tx: any) => tx.type === 'payout')
    .reduce((sum: number, tx: any) => sum + (tx.amountContributed ?? 0), 0)

  return { balance: settledSum + payoutsSum, settledContributions }
}
