import type { CollectionAfterReadHook } from 'payload'

/**
 * Computes amountDue = amountPaidByContributor - platformCharge
 * This is the net amount that goes into the jar after fees.
 */
export const computeAmountDue: CollectionAfterReadHook = ({ doc }) => {
  if (doc?.type !== 'contribution') return doc

  const paid = doc.chargesBreakdown?.amountPaidByContributor
  const fee = doc.chargesBreakdown?.platformCharge ?? 0

  if (paid != null) {
    doc.amountDue = Math.round((Math.abs(paid) - Math.abs(fee)) * 100) / 100
  }

  return doc
}
