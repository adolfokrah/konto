import { fcmNotifications } from '@/utilities/fcmPushNotifications'

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
async function notifyReferrer(
  payload: any,
  referrerId: string,
  title: string,
  body: string,
  data: Record<string, string>,
) {
  try {
    const referrer = await payload.findByID({
      collection: 'users',
      id: referrerId,
      overrideAccess: true,
    })
    const fcmToken = referrer?.fcmToken
    if (fcmToken) {
      await fcmNotifications.sendNotification([fcmToken], body, title, data)
    }
  } catch (err: any) {
    console.error('[process-referral-bonus] Failed to send push notification:', err.message)
  }
}

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
          status: 'paid',
          description: `GHS ${bonusAmount} bonus — referred user's jar received its first contribution`,
        },
        overrideAccess: true,
      })

      console.log(
        `[process-referral-bonus] first_contribution bonus created for referrer ${referrerId}`,
      )

      await notifyReferrer(
        req.payload,
        referrerId,
        'Referral Bonus Earned 🎉',
        `You earned GHS ${bonusAmount.toFixed(2)}! Your referred friend just made their first contribution.`,
        { type: 'referral_bonus', bonusType: 'first_contribution' },
      )
    }

    // ── Bonus type 2: Fee share on payout ─────────────────────────────────────
    if (doc.type === 'payout') {
      const payoutFeeAmount = doc.payoutFeeAmount ?? 0
      if (payoutFeeAmount <= 0) return

      // Only reward fee share from the referred user's FIRST jar
      // (the jar that received their first completed mobile-money contribution)
      const userJars = await req.payload.find({
        collection: 'jars',
        where: { creator: { equals: creatorId } },
        limit: 100,
        pagination: false,
      })
      const jarIds = userJars.docs.map((j) => j.id)

      const firstContribResult = await req.payload.find({
        collection: 'transactions',
        where: {
          and: [
            { jar: { in: jarIds } },
            { type: { equals: 'contribution' } },
            { paymentStatus: { equals: 'completed' } },
            { paymentMethod: { equals: 'mobile-money' } },
          ],
        },
        sort: 'createdAt',
        limit: 1,
        pagination: false,
      })

      if (firstContribResult.totalDocs === 0) return

      const firstJarId =
        typeof firstContribResult.docs[0].jar === 'object'
          ? firstContribResult.docs[0].jar?.id
          : firstContribResult.docs[0].jar

      if (jarId !== firstJarId) return

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
          status: 'paid',
          description: `${referralFeeSharePercent}% of Hogapay's withdrawal fee — GHS ${bonusAmount}`,
        },
        overrideAccess: true,
      })

      console.log(
        `[process-referral-bonus] fee_share bonus of GHS ${bonusAmount} created for referrer ${referrerId}`,
      )

      await notifyReferrer(
        req.payload,
        referrerId,
        'Referral Bonus Earned',
        `You earned GHS ${bonusAmount.toFixed(2)} from your referred friend's withdrawal.`,
        { type: 'referral_bonus', bonusType: 'fee_share' },
      )
    }
  } catch (err: any) {
    console.error(`[process-referral-bonus] Error:`, err.message)
  }
}
