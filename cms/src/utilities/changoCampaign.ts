import type { Payload, PayloadRequest } from 'payload'

import type { Jar } from '@/payload-types'
import type { ChangoCreateCampaignRequest } from './chango'
import { getChango } from './initalise'

type CampaignJar = Pick<Jar, 'id' | 'name' | 'description' | 'goalAmount' | 'deadline'>

/**
 * The Chango campaign for a jar. Every campaign settles into the one account in env
 * (`CHANGO_BANK_ID`, `CHANGO_BRANCH_ID`, `CHANGO_PAYMENT_DESTINATION_NUMBER`) until payout
 * accounts are brought over.
 */
export function buildCampaignRequest(jar: CampaignJar): ChangoCreateCampaignRequest {
  const bankId = process.env.CHANGO_BANK_ID
  const branchId = process.env.CHANGO_BRANCH_ID
  const accountNumber = process.env.CHANGO_PAYMENT_DESTINATION_NUMBER
  if (!bankId || !branchId || !accountNumber) {
    throw new Error(
      'CHANGO_BANK_ID, CHANGO_BRANCH_ID and CHANGO_PAYMENT_DESTINATION_NUMBER must be set',
    )
  }

  return {
    campaign_name: jar.name,
    campaign_type: jar.deadline ? 'temporary' : 'perpetual',
    description: jar.description?.trim() || jar.name,
    bank_id: bankId,
    branch_id: branchId,
    payment_destination_number: accountNumber,
    // Chango requires an end date on temporary campaigns and rejects one on perpetual ones.
    ...(jar.deadline && { end: new Date(jar.deadline).toISOString() }),
    target: jar.goalAmount ?? 0,
    hide_total_amount: false,
    hide_donor_count: false,
    hide_donors: false,
  }
}

/**
 * Returns the jar's Chango campaign id, creating the campaign and saving its id on the jar
 * when it has none yet.
 */
export async function ensureChangoCampaign(
  payload: Payload,
  jar: CampaignJar & Pick<Jar, 'changoCampaignId'>,
  /** Pass inside hooks so the jar update joins the request's transaction. */
  req?: PayloadRequest,
): Promise<string> {
  if (jar.changoCampaignId) return jar.changoCampaignId

  const { campaign } = await getChango().createCampaign(
    process.env.CHANGO_GROUP_ID!,
    buildCampaignRequest(jar),
  )

  await payload.update({
    collection: 'jars',
    id: jar.id,
    data: { changoCampaignId: campaign.campaignId },
    overrideAccess: true,
    context: { skipChangoCampaign: true },
    req,
  })

  console.log(`[chango] created campaign ${campaign.campaignId} for jar ${jar.id}`)
  return campaign.campaignId
}
