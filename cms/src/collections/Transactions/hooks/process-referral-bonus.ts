/**
 * afterChange hook: processes referral bonuses when a transaction completes.
 *
 * Two bonus types:
 * 1. first_contribution — flat GHS amount (from SystemSettings) paid to the referrer
 *    when a referred user's jar receives its very first completed contribution.
 *
 * 2. fee_share — percentage of Hogapay's withdrawal revenue paid to the referrer
 *    on every completed payout from a referred user's jar.
 */
export const processReferralBonus = async ({
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
  const isNewlyCompleted =
    doc.paymentStatus === 'completed' &&
    (operation === 'create' || previousDoc?.paymentStatus !== 'completed')

  if (!isNewlyCompleted) return

  try {
    // Resolve jar ID and fetch jar to get the creator
    const jarId = typeof doc.jar === 'object' ? doc.jar?.id : doc.jar
    if (!jarId) return

    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
    })
    if (!jar) return

    const creatorId = typeof jar.creator === 'object' ? jar.creator?.id : jar.creator
    if (!creatorId) return

    // Check if this jar creator was referred by someone
    const referralResult = await req.payload.find({
      collection: 'referrals',
      where: { referral: { equals: creatorId } },
      limit: 1,
      pagination: false,
    })
    if (referralResult.totalDocs === 0) return

    const referral = referralResult.docs[0]
    const referrerId =
      typeof referral.referredBy === 'object' ? referral.referredBy?.id : referral.referredBy

    // Fetch system settings for bonus amounts
    const settings = await req.payload.findGlobal({ slug: 'system-settings' })

    // ── Bonus type 1: First contribution ──────────────────────────────────────
    if (doc.type === 'contribution' && doc.paymentMethod === 'mobile-money') {
      // Count previous completed contributions to this jar (excluding current doc)
      const previousContributions = await req.payload.find({
        collection: 'transactions',
        where: {
          and: [
            { jar: { equals: jarId } },
            { type: { equals: 'contribution' } },
            { paymentStatus: { equals: 'completed' } },
            { id: { not_equals: doc.id } },
          ],
        },
        limit: 1,
        pagination: false,
      })

      if (previousContributions.totalDocs > 0) return // Not the first contribution

      // Guard: don't create duplicate first_contribution bonus for this referral
      const existingBonus = await req.payload.find({
        collection: 'referral-bonuses',
        where: {
          and: [
            { referral: { equals: referral.id } },
            { bonusType: { equals: 'first_contribution' } },
          ],
        },
        limit: 1,
        pagination: false,
      })
      if (existingBonus.totalDocs > 0) return

      const bonusAmount = settings?.referralFirstContributionBonus ?? 5

      await req.payload.create({
        collection: 'referral-bonuses',
        data: {
          user: referrerId,
          referral: referral.id,
          bonusType: 'first_contribution',
          amount: bonusAmount,
          status: 'pending',
          description: `GHS ${bonusAmount} bonus — referred user's jar received its first contribution`,
        },
        overrideAccess: true,
      })

      console.log(
        `[process-referral-bonus] first_contribution bonus created for referrer ${referrerId}`,
      )
    }

    // ── Bonus type 2: Fee share on payout ─────────────────────────────────────
    if (doc.type === 'payout') {
      const payoutFeeAmount = doc.payoutFeeAmount ?? 0
      if (payoutFeeAmount <= 0) return

      const transferFeePercentage = settings?.transferFeePercentage ?? 1
      const hogapayTransferFeePercent = settings?.hogapayTransferFeePercent ?? 0.5
      const referralFeeSharePercent = settings?.referralFeeSharePercent ?? 20

      // Hogapay's share of the payout fee
      const hogapayRevenue =
        transferFeePercentage > 0
          ? payoutFeeAmount * (hogapayTransferFeePercent / transferFeePercentage)
          : 0

      const bonusAmount = parseFloat((hogapayRevenue * (referralFeeSharePercent / 100)).toFixed(4))
      if (bonusAmount <= 0) return

      await req.payload.create({
        collection: 'referral-bonuses',
        data: {
          user: referrerId,
          referral: referral.id,
          transaction: doc.id,
          bonusType: 'fee_share',
          amount: bonusAmount,
          status: 'pending',
          description: `${referralFeeSharePercent}% of Hogapay's withdrawal fee — GHS ${bonusAmount}`,
        },
        overrideAccess: true,
      })

      console.log(
        `[process-referral-bonus] fee_share bonus of GHS ${bonusAmount} created for referrer ${referrerId}`,
      )
    }
  } catch (err: any) {
    console.error(`[process-referral-bonus] Error:`, err.message)
  }
}
