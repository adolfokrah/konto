import type { Payload } from 'payload'

import { getAllCampaignContributions, type JarContribution } from './changoContributions'

/** Our clock and Chango's can disagree a little; a payment can't land long before checkout. */
const CLOCK_SKEW_MS = 5 * 60 * 1000

export interface ChangoTransaction {
  id: string
  contributor?: string | null
  amountContributed: number
  createdAt: string
  paymentStatus?: string | null
}

const normaliseName = (name?: string | null) =>
  (name || 'Anonymous').trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * Pairs each Chango contribution with one of our transactions and returns the ids of pending
 * ones that were paid.
 *
 * Chango's list carries no reference, only name, amount and time, so a contribution matches the
 * earliest unpaired transaction with the same name and amount created before it. Walking both
 * in time order lets already-completed transactions claim their payments first, so a payment is
 * never counted twice.
 */
export function matchChangoContributions(
  contributions: JarContribution[],
  transactions: ChangoTransaction[],
): string[] {
  const byTime = <T>(list: T[], at: (item: T) => string) =>
    [...list].sort((a, b) => Date.parse(at(a)) - Date.parse(at(b)))

  const unpaired = byTime(transactions, (t) => t.createdAt)
  const paid: string[] = []

  for (const contribution of byTime(contributions, (c) => c.createdAt)) {
    const paidAt = Date.parse(contribution.createdAt)
    const index = unpaired.findIndex(
      (t) =>
        normaliseName(t.contributor) === normaliseName(contribution.contributor) &&
        Math.abs(Number(t.amountContributed) - contribution.amountContributed) < 0.005 &&
        Date.parse(t.createdAt) <= paidAt + CLOCK_SKEW_MS,
    )
    if (index === -1) continue

    const [transaction] = unpaired.splice(index, 1)
    if (transaction.paymentStatus === 'pending') paid.push(transaction.id)
  }

  return paid
}

/**
 * Marks a jar's pending Chango transactions completed when Chango has received the payment.
 * Returns the ids it completed.
 */
export async function reconcileChangoJar(
  payload: Payload,
  jar: { id: string; changoCampaignId?: string | null },
): Promise<string[]> {
  if (!jar.changoCampaignId) return []

  const { docs: transactions } = await payload.find({
    collection: 'transactions',
    where: {
      jar: { equals: jar.id },
      type: { equals: 'contribution' },
      changoInvoiceId: { exists: true },
      paymentStatus: { in: ['pending', 'completed'] },
    },
    pagination: false,
    depth: 0,
    select: { contributor: true, amountContributed: true, createdAt: true, paymentStatus: true },
    overrideAccess: true,
  })

  if (!transactions.some((t) => t.paymentStatus === 'pending')) return []

  const { contributions } = await getAllCampaignContributions(jar.changoCampaignId)
  const paid = matchChangoContributions(contributions, transactions as ChangoTransaction[])

  for (const id of paid) {
    await payload.update({
      collection: 'transactions',
      id,
      data: { paymentStatus: 'completed' },
      overrideAccess: true,
      context: { skipCharges: true },
    })
    console.log(`[chango] contribution ${id} confirmed paid on Chango`)
  }

  return paid
}
