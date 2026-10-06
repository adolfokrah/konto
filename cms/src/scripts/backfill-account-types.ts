import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Backfill script: sets `accountType` on existing users.
 *
 * - Users who submitted a business verification (any status) → organization: until now KYB was
 *   required of everyone, so anyone who started it was setting up to collect as a business.
 * - Everyone else → individual (the default for new sign-ups).
 *
 * Verification is unchanged: an organization still needs KYB approved + owner KYC, an
 * individual needs KYC (see utilities/kyb.ts).
 *
 * Writes the field directly (bypassing user hooks) because this only sets the type.
 *
 * Run once: npx tsx src/scripts/backfill-account-types.ts
 */
async function backfill() {
  const payload = await getPayload({ config: configPromise })

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

  console.log(`Found ${users.docs.length} users without an account type`)

  let organizations = 0
  let individuals = 0
  for (const user of users.docs) {
    const accountType = organizationIds.has(user.id) ? 'organization' : 'individual'
    try {
      await payload.db.updateOne({
        collection: 'users',
        where: { id: { equals: user.id } },
        data: { accountType },
      })
      accountType === 'organization' ? organizations++ : individuals++
    } catch (error: any) {
      console.error(`Failed to backfill user ${user.id}: ${error.message}`)
    }
  }

  console.log(`Set ${organizations} organizations and ${individuals} individuals`)
  process.exit(0)
}

backfill().catch((error) => {
  console.error(error)
  process.exit(1)
})
