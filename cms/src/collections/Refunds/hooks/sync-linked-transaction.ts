/**
 * afterChange hook on Refunds collection.
 *
 * When a refund status changes to 'completed', marks the original
 * linked transaction's paymentStatus as 'failed'.
 * When a refund status changes to 'failed', no action on the linked transaction.
 */
export const syncLinkedTransaction = async ({
  doc,
  previousDoc,
  operation,
  req,
}: {
  doc: any
  previousDoc?: any
  operation: 'create' | 'update'
  req: any
}) => {
  // Only act on status changing to 'completed'
  if (doc.status !== 'completed') return
  if (operation === 'update' && previousDoc?.status === 'completed') return

  const linkedId =
    typeof doc.linkedTransaction === 'object' ? doc.linkedTransaction?.id : doc.linkedTransaction

  if (!linkedId) return

  try {
    await req.payload.update({
      collection: 'transactions',
      id: linkedId,
      data: { paymentStatus: 'failed' },
      overrideAccess: true,
      context: { skipCharges: true },
    })
    console.log(
      `[sync-linked-transaction] Marked transaction ${linkedId} as failed (refund ${doc.id} completed)`,
    )
  } catch (err: any) {
    console.error(
      `[sync-linked-transaction] Failed to update transaction ${linkedId}:`,
      err.message,
    )
  }
}
