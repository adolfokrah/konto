import type { CollectionAfterChangeHook } from 'payload'

import { ensureChangoCampaign } from '@/utilities/changoCampaign'

/**
 * Gives every new jar a Chango campaign to collect into. A failure never blocks the jar: the
 * campaign is created at checkout instead.
 */
export const createChangoCampaign: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create' || doc.changoCampaignId || context?.skipChangoCampaign) return doc

  try {
    doc.changoCampaignId = await ensureChangoCampaign(req.payload, doc, req)
  } catch (err: any) {
    console.error(`[chango] could not create campaign for jar ${doc.id}:`, err?.message)
  }
  return doc
}
