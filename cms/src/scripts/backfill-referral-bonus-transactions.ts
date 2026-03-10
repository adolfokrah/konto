import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

/**
 * Backfill script: links the triggering transaction to existing first_contribution
 * and fee_share referral-bonus records that were created before the transaction
 * field was added to the hook.
 *
 * Logic:
 * - first_contribution: find the referred user's first completed mobile-money
 *   contribution across all their jars and link it.
 * - fee_share: these are tied to a specific payout — we can't reliably reconstruct
 *   which payout triggered each record, so they are skipped.
 *
 * Run once: npx tsx src/scripts/backfill-referral-bonus-transactions.ts
 */
async function backfill() {
  const payload = await getPayloadHMR({ config: configPromise })

  console.log('Fetching first_contribution bonuses with no transaction...')

  const bonuses = await payload.find({
    collection: 'referral-bonuses' as any,
    where: {
      and: [{ bonusType: { equals: 'first_contribution' } }, { transaction: { exists: false } }],
    },
    limit: 1000,
    pagination: false,
    depth: 2,
    overrideAccess: true,
  })

  console.log(`Found ${bonuses.docs.length} bonuses to backfill`)

  let updated = 0
  let skipped = 0

  for (const bonus of bonuses.docs as any[]) {
    const referralObj = typeof bonus.referral === 'object' ? bonus.referral : null
    if (!referralObj) {
      skipped++
      continue
    }

    // Get the referred user from the referral record
    const referredUserId =
      typeof referralObj.referral === 'object' ? referralObj.referral?.id : referralObj.referral
    if (!referredUserId) {
      skipped++
      continue
    }

    // Find all jars owned by the referred user
    const jarsResult = await payload.find({
      collection: 'jars',
      where: { creator: { equals: referredUserId } },
      limit: 100,
      pagination: false,
      overrideAccess: true,
    })
    const jarIds = (jarsResult.docs as any[]).map((j: any) => j.id)
    if (jarIds.length === 0) {
      skipped++
      continue
    }

    // Find their very first completed mobile-money contribution
    const firstContrib = await payload.find({
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
      overrideAccess: true,
    })

    if (firstContrib.totalDocs === 0) {
      skipped++
      continue
    }

    const txId = (firstContrib.docs[0] as any).id

    await payload.update({
      collection: 'referral-bonuses' as any,
      id: bonus.id,
      data: { transaction: txId },
      overrideAccess: true,
    })

    console.log(`  Bonus ${bonus.id} → transaction ${txId}`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
  process.exit(0)
}

backfill().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
