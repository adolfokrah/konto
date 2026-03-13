/**
 * checkBatchCompletion hook — runs on the Refunds collection afterChange.
 *
 * When an individual auto refund (refundType: 'auto') changes to 'completed'
 * or 'failed', check if all sibling refunds from the same batch are also done.
 * If so, mark the parent batch refund as 'completed' and unfreeze the jar.
 */
export const checkBatchCompletion = async ({ doc, previousDoc, req }: any) => {
  try {
    const newStatus = doc?.status
    const oldStatus = previousDoc?.status

    if (newStatus === oldStatus) return
    if (newStatus !== 'completed' && newStatus !== 'failed') return

    // Only applies to individual auto refunds linked to a batch
    if (doc?.refundType !== 'auto') return
    const batchRefundId = doc?.batchRefund
    if (!batchRefundId) return

    const payload = req?.payload
    if (!payload) return

    // Fetch the parent batch
    const batch = await payload.findByID({
      collection: 'refunds' as any,
      id: batchRefundId,
      depth: 0,
      overrideAccess: true,
    })

    if (!batch) return

    const batchStatus = (batch as any).status
    if (batchStatus === 'completed' || batchStatus === 'cancelled') return

    // Get all child refund IDs from the batch
    const childRefundsArray: any[] = (batch as any).childRefunds || []
    if (!childRefundsArray.length) return

    const childIds = childRefundsArray.map((r: any) =>
      typeof r.refund === 'object' ? r.refund?.id : r.refund,
    )

    // Check if all children are done
    const children = await payload.find({
      collection: 'refunds' as any,
      where: { id: { in: childIds } },
      pagination: false,
      select: { status: true },
      overrideAccess: true,
    })

    const allDone = children.docs.every(
      (r: any) => r.status === 'completed' || r.status === 'failed',
    )

    if (!allDone) return

    // All children done — mark batch completed and unfreeze jar
    await payload.update({
      collection: 'refunds' as any,
      id: batchRefundId,
      data: { status: 'completed' } as any,
      overrideAccess: true,
    })

    const jarId =
      typeof (batch as any).jar === 'object' ? (batch as any).jar?.id : (batch as any).jar

    if (jarId) {
      await payload.update({
        collection: 'jars',
        id: jarId,
        data: { status: 'open', freezeReason: null } as any,
        overrideAccess: true,
      })
    }

    console.log(
      `Refund batch ${batchRefundId} completed. ${childIds.length} refund(s) processed. Jar ${jarId} unfrozen.`,
    )
  } catch (err: any) {
    console.error('checkBatchCompletion hook error:', err?.message || err)
  }
}
