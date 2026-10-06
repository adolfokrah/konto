import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { backfillJarShortCodes } from '@/utilities/backfills'

/**
 * Local alternative to POST /api/run-backfills (jars without a short code).
 * Run: npx tsx src/scripts/backfill-jar-short-codes.ts [--dry-run]
 */
async function run() {
  const payload = await getPayload({ config: configPromise })
  const result = await backfillJarShortCodes(payload, {
    dryRun: process.argv.includes('--dry-run'),
  })
  console.log('jars without a short code:', JSON.stringify(result))
  process.exit(result.failed ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
