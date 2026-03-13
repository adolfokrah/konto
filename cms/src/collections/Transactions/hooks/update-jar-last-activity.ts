/**
 * updateJarLastActivity — runs on Transactions afterChange.
 *
 * When a contribution is marked completed, update the jar's lastActivityAt
 * to the transaction's createdAt. This enables efficient DB-level filtering
 * in the withdraw-reminder and auto-refund daily tasks.
 */
export const updateJarLastActivity = async ({ doc, previousDoc, req }: any) => {
  try {
    if (doc?.type !== 'contribution') return
    if (doc?.paymentStatus !== 'completed') return
    if (previousDoc?.paymentStatus === 'completed') return

    const jarId = typeof doc?.jar === 'object' ? doc?.jar?.id : doc?.jar
    if (!jarId) return

    const payload = req?.payload
    if (!payload) return

    await payload.update({
      collection: 'jars',
      id: jarId,
      data: { lastActivityAt: doc.createdAt } as any,
      overrideAccess: true,
    })
  } catch (err: any) {
    console.error('updateJarLastActivity hook error:', err?.message || err)
  }
}
