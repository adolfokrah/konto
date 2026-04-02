import type { CollectionBeforeChangeHook } from 'payload'

export const getCharges: CollectionBeforeChangeHook = async ({ data, operation, req, context }) => {
  if (context?.skipCharges) return data

  if (data.paymentStatus === 'failed') {
    data.chargesBreakdown = {
      platformCharge: 0,
      amountPaidByContributor: data.amountContributed || 0,
      hogapayRevenue: 0,
      eganowFees: 0,
      discountPercent: 0,
      discountAmount: 0,
      amountToSendToEganow: data.amountContributed || 0,
      collectionFeePercent: 0,
    }
    if (data.type === 'payout') {
      data.payoutFeePercentage = 0
      data.payoutFeeAmount = 0
      data.payoutNetAmount = data.amountContributed || 0
    }
    return data
  }

  if (operation === 'create' || operation === 'update') {
    if (data.type === 'contribution') {
      if (data.paymentMethod === 'mobile-money') {
        // Resolve which user's discount to apply:
        // 1. Explicit contributorUserId on the transaction
        // 2. Fall back to the jar creator (used for public pay-page contributions)
        let discountPercent = 0
        const contributorUserId = data.contributorUserId || context?.contributorUserId

        let discountUserId: string | null = contributorUserId ?? null

        if (!discountUserId && data.jar) {
          try {
            const jarId = typeof data.jar === 'object' ? (data.jar as any).id : data.jar
            const jar = await req.payload.findByID({
              collection: 'jars',
              id: jarId,
              depth: 0,
              overrideAccess: true,
            })
            const creator = (jar as any).creator
            discountUserId = typeof creator === 'object' ? creator?.id : (creator ?? null)
            console.log(
              `[getCharges] jarId=${jarId} creator=${JSON.stringify(creator)} discountUserId=${discountUserId}`,
            )
          } catch (e: any) {
            console.warn(`[getCharges] Jar lookup failed:`, e.message)
          }
        }

        if (discountUserId) {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: discountUserId,
              depth: 0,
              overrideAccess: true,
            })
            discountPercent = (user as any).hogapayDiscountPercent ?? 0
            console.log(
              `[getCharges] discountUserId=${discountUserId} hogapayDiscountPercent=${discountPercent}`,
            )
          } catch {
            console.warn(`[getCharges] User ${discountUserId} not found — no discount`)
          }
        } else {
          console.warn(
            `[getCharges] No discountUserId resolved for jar=${data.jar} contributorUserId=${data.contributorUserId}`,
          )
        }

        data.chargesBreakdown = {
          platformCharge: 0,
          amountPaidByContributor: data.amountContributed,
          hogapayRevenue: 0,
          eganowFees: 0,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: data.amountContributed,
          collectionFeePercent: 0,
        }
      } else {
        // No charges for cash or other payment methods
        data.chargesBreakdown = {
          platformCharge: 0,
          amountPaidByContributor: data.amountContributed,
          hogapayRevenue: 0,
          eganowFees: 0,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: data.amountContributed,
          collectionFeePercent: 0,
        }
      }
    }

    if (data.type === 'payout') {
      data.payoutFeePercentage = 0
      data.payoutFeeAmount = 0
      data.payoutNetAmount = data.amountContributed

      data.chargesBreakdown = {
        platformCharge: 0,
        amountPaidByContributor: data.amountContributed,
        hogapayRevenue: 0,
        eganowFees: 0,
        discountPercent: 0,
        discountAmount: 0,
        amountToSendToEganow: data.amountContributed,
        collectionFeePercent: 0,
      }
    }
  }

  return data
}
