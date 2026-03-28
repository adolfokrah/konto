/**
 * afterChange hook: creates a Cashback record when a contribution is newly completed
 * and a discount was applied (chargesBreakdown.discountAmount > 0).
 *
 * Fires regardless of whether the status was set by the Eganow webhook,
 * verify-payment polling, or any other mechanism.
 */
export const createCashback = async ({ doc, previousDoc, req }: any) => {
  try {
    // Only on contribution → completed transition
    if (doc?.type !== 'contribution') return
    if (doc?.paymentStatus !== 'completed') return
    if (previousDoc?.paymentStatus === 'completed') return

    const breakdown = doc.chargesBreakdown as any
    const discountAmount: number = breakdown?.discountAmount ?? 0

    if (discountAmount <= 0) return

    // Resolve the user to credit: contributorUserId on transaction, or fall back to jar creator
    let cashbackUserId: string | null =
      (doc as any).contributorUserId || (doc as any).contributorUser || null

    if (!cashbackUserId) {
      const jarField = doc.jar
      const jarId = typeof jarField === 'object' ? jarField?.id : jarField
      if (jarId) {
        try {
          const jar = await req.payload.findByID({
            collection: 'jars',
            id: jarId,
            depth: 0,
            overrideAccess: true,
          })
          const creator = (jar as any).creator
          cashbackUserId = typeof creator === 'object' ? creator?.id : (creator ?? null)
        } catch {
          /* ignore */
        }
      }
    }

    if (!cashbackUserId) {
      console.warn(`[createCashback] No user resolved for transaction ${doc.id} — skipping`)
      return
    }

    // Check if a cashback already exists for this transaction to avoid duplicates
    const existing = await req.payload.find({
      collection: 'cashbacks' as any,
      where: { transaction: { equals: doc.id } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) {
      console.log(`[createCashback] Cashback already exists for transaction ${doc.id} — skipping`)
      return
    }

    const jarName = typeof doc.jar === 'object' ? (doc.jar as any)?.name : undefined

    await req.payload.create({
      collection: 'cashbacks' as any,
      data: {
        transaction: doc.id,
        user: cashbackUserId,
        contributor: doc.contributor || undefined,
        jarName: jarName || undefined,
        originalAmount: doc.amountContributed,
        discountPercent: breakdown.discountPercent ?? 0,
        discountAmount,
        hogapayRevenue: breakdown.hogapayRevenue ?? 0,
      },
      overrideAccess: true,
    })

    console.log(`[createCashback] Cashback created for transaction ${doc.id}`)
  } catch (err: any) {
    console.error(`[createCashback] Failed for transaction ${doc?.id}:`, err.message)
  }
}
