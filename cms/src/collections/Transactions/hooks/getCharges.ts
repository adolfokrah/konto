import type { CollectionBeforeChangeHook } from 'payload'
import { calculateCharges } from '../../../utilities/calculateCharges'

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
    // Pull fee percentages from system settings
    const settings = await req.payload.findGlobal({
      slug: 'system-settings',
      overrideAccess: true,
    })

    const hogapayCollectionFeePercent = (settings.hogapayCollectionFeePercent ?? 0.8) as number
    const hogapayTransferFeePercent = (settings.hogapayTransferFeePercent ?? 0.5) as number
    const collectionFeePercent = (settings.collectionFee ?? 2) as number

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

        const charges = calculateCharges({
          amountContributed: data.amountContributed,
          hogapayCollectionFeePercent,
          collectionFeePercent,
          discountPercent,
        })

        console.log(`[getCharges] saving chargesBreakdown:`, JSON.stringify(charges))
        data.chargesBreakdown = {
          platformCharge: charges.platformCharge,
          amountPaidByContributor: charges.amountPaidByContributor,
          hogapayRevenue: charges.hogapayRevenue,
          eganowFees: charges.eganowFees,
          discountPercent: charges.discountPercent,
          discountAmount: charges.discountAmount,
          amountToSendToEganow: charges.amountToSendToEganow,
          collectionFeePercent,
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
      const transferFee = (settings.transferFeePercentage ?? 0) as number
      const transferFeeDecimal = transferFee / 100
      const feeAmount = data.amountContributed * transferFeeDecimal
      const netAmount = data.amountContributed - feeAmount

      data.payoutFeePercentage = transferFee
      data.payoutFeeAmount = feeAmount
      data.payoutNetAmount = netAmount

      if (data.paymentMethod === 'mobile-money') {
        const hogapayRevenue = (data.amountContributed * hogapayTransferFeePercent) / 100
        const eganowFees = feeAmount - hogapayRevenue

        data.chargesBreakdown = {
          platformCharge: feeAmount,
          amountPaidByContributor: data.amountContributed,
          hogapayRevenue: hogapayRevenue,
          eganowFees: eganowFees,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: data.amountContributed,
          collectionFeePercent: transferFee,
        }
      } else {
        data.chargesBreakdown = {
          platformCharge: feeAmount,
          amountPaidByContributor: data.amountContributed,
          hogapayRevenue: 0,
          eganowFees: 0,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: data.amountContributed,
          collectionFeePercent: transferFee,
        }
      }
    }
  }

  return data
}
