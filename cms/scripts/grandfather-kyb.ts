/**
 * One-off migration: grandfather existing users into KYB.
 *
 * Business verification (kybStatus) now gates contributions + payouts. Existing users
 * default to 'none' and would be blocked on deploy. This sets every current user's
 * kybStatus to 'approved' so only NEW signups (after launch) must submit KYB.
 *
 * Run ONCE at deploy time (from cms/):
 *   npx tsx scripts/grandfather-kyb.ts          # dry-run (counts only)
 *   npx tsx scripts/grandfather-kyb.ts --apply  # actually update
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const apply = process.argv.includes('--apply')
  const payload = await getPayload({ config })

  // Existing users who are not yet KYB-approved (none / missing / rejected left as-is? -> only 'none' & missing)
  const res = await payload.find({
    collection: 'users',
    where: {
      or: [{ kybStatus: { equals: 'none' } }, { kybStatus: { exists: false } }],
    },
    limit: 0, // all
    depth: 0,
    overrideAccess: true,
  })

  console.log(`Found ${res.totalDocs} users to grandfather (kybStatus none/missing).`)

  if (!apply) {
    console.log('DRY RUN — re-run with --apply to update.')
    process.exit(0)
  }

  let updated = 0
  for (const user of res.docs) {
    try {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { kybStatus: 'approved' },
        overrideAccess: true,
      })
      updated++
    } catch (e: any) {
      console.error(`Failed for user ${user.id}: ${e?.message}`)
    }
  }

  console.log(`Grandfathered ${updated}/${res.totalDocs} users to kybStatus=approved.`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
