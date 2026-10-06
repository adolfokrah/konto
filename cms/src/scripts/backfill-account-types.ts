import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { backfillAccountTypes } from '@/utilities/backfills'

/**
 * Local alternative to POST /api/run-backfills (users without an account type).
 * Run: npx tsx src/scripts/backfill-account-types.ts [--dry-run]
 */
async function run() {
  const payload = await getPayload({ config: configPromise })
  const result = await backfillAccountTypes(payload, { dryRun: process.argv.includes('--dry-run') })
  console.log('users without an account type:', JSON.stringify(result))
  process.exit(result.failed ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
