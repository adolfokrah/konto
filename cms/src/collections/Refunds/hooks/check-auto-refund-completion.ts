/**
 * checkAutoRefundCompletion hook — runs on the Refunds collection afterChange.
 *
 * When an auto refund changes to 'completed' or 'failed', check if all
 * other auto refunds for the same jar are also in a terminal state.
 * If so, unfreeze the jar.
 */
export const checkAutoRefundCompletion = async ({ doc, previousDoc, req }: any) => {
  try {
    const newStatus = doc?.status
    const oldStatus = previousDoc?.status

    if (newStatus === oldStatus) return
    if (newStatus !== 'completed' && newStatus !== 'failed') return
    if (doc?.refundType !== 'auto') return

    const jarId = typeof doc?.jar === 'object' ? doc?.jar?.id : doc?.jar
    if (!jarId) return

    const payload = req?.payload
    if (!payload) return

    // Find all auto refunds for this jar
    const allAutoRefunds = await payload.find({
      collection: 'refunds',
      where: {
        and: [{ jar: { equals: jarId } }, { refundType: { equals: 'auto' } }],
      },
      pagination: false,
      select: { status: true },
      overrideAccess: true,
    })

    const terminalStatuses = ['completed', 'failed', 'rejected']
    const allDone = allAutoRefunds.docs.every((r: any) => terminalStatuses.includes(r.status))

    if (!allDone) return

    // All done — unfreeze the jar
    await payload.update({
      collection: 'jars',
      id: jarId,
      data: { status: 'open', freezeReason: null } as any,
      overrideAccess: true,
    })

    console.log(`All auto refunds for jar ${jarId} completed. Jar unfrozen.`)
  } catch (err: any) {
    console.error('checkAutoRefundCompletion hook error:', err?.message || err)
  }
}
