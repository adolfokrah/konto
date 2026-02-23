import { PayloadRequest } from 'payload'

export const recalculateCharges = async (req: PayloadRequest) => {
  try {
    const { user } = req
    if (!user || (user as any).role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const cutoff = new Date('2026-02-14T00:00:00.000Z').toISOString()

    const old = await req.payload.find({
      collection: 'transactions',
      where: {
        paymentMethod: { equals: 'mobile-money' },
        createdAt: { less_than: cutoff },
        paymentStatus: { not_equals: 'failed' },
      },
      pagination: false,
      overrideAccess: true,
      select: { type: true, amountContributed: true },
    })

    let updated = 0
    for (const tx of old.docs) {
      const amount = tx.amountContributed || 0
      const data: Record<string, any> = {
        chargesBreakdown: {
          platformCharge: 0,
          amountPaidByContributor: amount,
          hogapayRevenue: 0,
          eganowFees: 0,
        },
      }
      if (tx.type === 'payout') {
        data.payoutFeePercentage = 0
        data.payoutFeeAmount = 0
        data.payoutNetAmount = amount
      }
      await req.payload.update({
        collection: 'transactions',
        id: tx.id,
        data,
        overrideAccess: true,
        context: { skipCharges: true },
      })
      updated++
    }

    // Also zero out all cash transactions (no charges for cash)
    const cashTxs = await req.payload.find({
      collection: 'transactions',
      where: { paymentMethod: { equals: 'cash' } },
      pagination: false,
      overrideAccess: true,
      select: { type: true, amountContributed: true },
    })

    let cashCount = 0
    for (const tx of cashTxs.docs) {
      const amount = tx.amountContributed || 0
      const data: Record<string, any> = {
        chargesBreakdown: {
          platformCharge: 0,
          amountPaidByContributor: amount,
          hogapayRevenue: 0,
          eganowFees: 0,
        },
      }
      if (tx.type === 'payout') {
        data.payoutFeePercentage = 0
        data.payoutFeeAmount = 0
        data.payoutNetAmount = amount
      }
      await req.payload.update({
        collection: 'transactions',
        id: tx.id,
        data,
        overrideAccess: true,
        context: { skipCharges: true },
      })
      cashCount++
    }

    // Also zero out all failed transactions (no revenue from failed)
    const failedTxs = await req.payload.find({
      collection: 'transactions',
      where: { paymentStatus: { equals: 'failed' } },
      pagination: false,
      overrideAccess: true,
      select: { type: true, amountContributed: true },
    })

    let failedCount = 0
    for (const tx of failedTxs.docs) {
      const amount = tx.amountContributed || 0
      const data: Record<string, any> = {
        chargesBreakdown: {
          platformCharge: 0,
          amountPaidByContributor: amount,
          hogapayRevenue: 0,
          eganowFees: 0,
        },
      }
      if (tx.type === 'payout') {
        data.payoutFeePercentage = 0
        data.payoutFeeAmount = 0
        data.payoutNetAmount = amount
      }
      await req.payload.update({
        collection: 'transactions',
        id: tx.id,
        data,
        overrideAccess: true,
        context: { skipCharges: true },
      })
      failedCount++
    }

    // Recalculate fees for mobile-money transactions from Feb 14 onwards (non-failed)
    // Updates WITHOUT skipCharges so the getCharges hook recalculates fees
    const newTxs = await req.payload.find({
      collection: 'transactions',
      where: {
        paymentMethod: { equals: 'mobile-money' },
        createdAt: { greater_than_equal: cutoff },
        paymentStatus: { not_equals: 'failed' },
      },
      pagination: false,
      overrideAccess: true,
      select: { type: true, amountContributed: true },
    })

    let recalculated = 0
    for (const tx of newTxs.docs) {
      await req.payload.update({
        collection: 'transactions',
        id: tx.id,
        data: {
          amountContributed: tx.amountContributed,
        },
        overrideAccess: true,
      })
      recalculated++
    }

    return Response.json({
      success: true,
      message: `Reset ${updated} momo (before Feb 14), ${cashCount} cash, ${failedCount} failed to 0. Recalculated ${recalculated} momo (from Feb 14).`,
      momoReset: updated,
      cashReset: cashCount,
      failedReset: failedCount,
      recalculated,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: 'Recalculation failed', error: error.message },
      { status: 500 },
    )
  }
}
