import type { BasePayload } from 'payload'

/**
 * Calculates the net available balance for a jar.
 *
 * Balance = settled contributions − (pending/awaiting/completed payouts)
 * Matches the logic used in payout-eganow.ts.
 *
 * Also returns settled contributions (with createdAt) for callers that need
 * to determine the last contribution date.
 */
export async function getJarBalance(
  payload: BasePayload,
  jarId: string,
): Promise<{ balance: number; settledContributions: any[] }> {
  const allTransactions = await payload.find({
    collection: 'transactions',
    where: { jar: { equals: jarId } },
    pagination: false,
    select: {
      amountContributed: true,
      type: true,
      isSettled: true,
      paymentStatus: true,
      createdAt: true,
    },
    overrideAccess: true,
  })

  const settledContributions = allTransactions.docs.filter(
    (tx: any) =>
      tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
  )

  const settledSum = settledContributions.reduce(
    (sum: number, tx: any) => sum + (tx.amountContributed ?? 0),
    0,
  )

  const payoutsSum = allTransactions.docs
    .filter(
      (tx: any) =>
        tx.type === 'payout' &&
        (tx.paymentStatus === 'pending' ||
          tx.paymentStatus === 'completed' ||
          tx.paymentStatus === 'awaiting-approval'),
    )
    .reduce((sum: number, tx: any) => sum + (tx.amountContributed ?? 0), 0)

  return { balance: settledSum + payoutsSum, settledContributions }
}
