import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { generateUniqueJarShortCode } from '@/utilities/shortCode'

/**
 * Backfill script: gives every existing jar a short share code (hogapay.com/j/<code>).
 * New jars get one automatically from the assignShortCode hook.
 *
 * Writes the field directly (bypassing the jar hooks, which validate permissions and
 * balances and send notifications) because this only adds the code.
 *
 * Run once: npx tsx src/scripts/backfill-jar-short-codes.ts
 */
async function backfill() {
  const payload = await getPayload({ config: configPromise })

  const jars = await payload.find({
    collection: 'jars',
    where: { shortCode: { exists: false } },
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  console.log(`Found ${jars.docs.length} jars without a short code`)

  let updated = 0
  for (const jar of jars.docs) {
    try {
      const shortCode = await generateUniqueJarShortCode(payload)
      await payload.db.updateOne({
        collection: 'jars',
        where: { id: { equals: jar.id } },
        data: { shortCode },
      })
      updated++
    } catch (error: any) {
      console.error(`Failed to backfill jar ${jar.id}: ${error.message}`)
    }
  }

  console.log(`Backfilled ${updated}/${jars.docs.length} jars`)
  process.exit(0)
}

backfill().catch((error) => {
  console.error(error)
  process.exit(1)
})
