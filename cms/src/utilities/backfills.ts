import type { Payload } from 'payload'

import { generateUniqueJarShortCode } from '@/utilities/shortCode'

export interface BackfillResult {
  /** Records that needed the backfill. */
  found: number
  /** Records updated (0 on a dry run). */
  updated: number
  failed: number
  details?: Record<string, number>
}

interface Options {
  dryRun?: boolean
}

/**
 * Gives every jar without one a short share code (hogapay.com/j/<code>). New jars get one
 * from the assignShortCode hook. Idempotent: jars that already have a code are skipped.
 */
export async function backfillJarShortCodes(
  payload: Payload,
  { dryRun = false }: Options = {},
): Promise<BackfillResult> {
  const jars = await payload.find({
    collection: 'jars',
    where: { shortCode: { exists: false } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const result: BackfillResult = { found: jars.docs.length, updated: 0, failed: 0 }
  if (dryRun) return result

  for (const jar of jars.docs) {
    try {
      // Direct write: skips the jar hooks (permission, balance and notification logic).
      await payload.db.updateOne({
        collection: 'jars',
        where: { id: { equals: jar.id } },
        data: { shortCode: await generateUniqueJarShortCode(payload) },
      })
      result.updated++
    } catch (error: any) {
      result.failed++
      payload.logger.error(`[backfill] jar ${jar.id} short code: ${error.message}`)
    }
  }
  return result
}

/**
 * Sets accountType on users who have none: users with a business verification (any status)
 * become organizations, everyone else individuals. Idempotent: users that already have a
 * type are skipped.
 */
export async function backfillAccountTypes(
  payload: Payload,
  { dryRun = false }: Options = {},
): Promise<BackfillResult> {
  const verifications = await payload.find({
    collection: 'business-verifications',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const organizationIds = new Set(
    verifications.docs
      .map((v: any) => (typeof v.user === 'object' ? v.user?.id : v.user))
      .filter(Boolean),
  )

  const users = await payload.find({
    collection: 'users',
    where: { accountType: { exists: false } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const details = { organization: 0, individual: 0 }
  for (const user of users.docs) {
    details[organizationIds.has(user.id) ? 'organization' : 'individual']++
  }
  const result: BackfillResult = { found: users.docs.length, updated: 0, failed: 0, details }
  if (dryRun) return result

  for (const user of users.docs) {
    try {
      // Direct write: skips the user hooks; this only sets the type.
      await payload.db.updateOne({
        collection: 'users',
        where: { id: { equals: user.id } },
        data: { accountType: organizationIds.has(user.id) ? 'organization' : 'individual' },
      })
      result.updated++
    } catch (error: any) {
      result.failed++
      payload.logger.error(`[backfill] user ${user.id} account type: ${error.message}`)
    }
  }
  return result
}
