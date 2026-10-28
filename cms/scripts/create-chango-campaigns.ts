/**
 * One-off: give every existing jar without a Chango campaign its campaign.
 *
 * New jars get one when they're created, and any jar still missing one gets it on its first
 * contribution, so this only saves that first payer the wait.
 *
 * Run from cms/:
 *   npx tsx scripts/create-chango-campaigns.ts          # dry-run (lists jars only)
 *   npx tsx scripts/create-chango-campaigns.ts --apply  # create the campaigns
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { buildCampaignRequest, ensureChangoCampaign } from '../src/utilities/changoCampaign'

const apply = process.argv.includes('--apply')

async function main() {
  const database = (process.env.DATABASE_URI || '').replace(/\/\/[^@]*@/, '//***@')
  console.log(`Database: ${database}`)
  console.log(`Chango:   ${process.env.CHANGO_BASE_URL} (group ${process.env.CHANGO_GROUP_ID})`)
  console.log(apply ? 'Mode:     APPLY\n' : 'Mode:     dry-run (pass --apply to create)\n')

  const payload = await getPayload({ config })

  const { docs: jars } = await payload.find({
    collection: 'jars',
    where: {
      or: [{ changoCampaignId: { exists: false } }, { changoCampaignId: { equals: '' } }],
    },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  console.log(`${jars.length} jar(s) without a Chango campaign`)

  let created = 0
  let failed = 0
  for (const jar of jars) {
    const request = buildCampaignRequest(jar)
    const label = `${jar.id}  "${jar.name}"  ${request.campaign_type}  target ${request.target}`

    if (!apply) {
      console.log(`  would create  ${label}`)
      continue
    }

    try {
      const campaignId = await ensureChangoCampaign(payload, jar)
      created++
      console.log(`  created ${campaignId}  ${label}`)
    } catch (err: any) {
      failed++
      console.error(`  FAILED  ${label}: ${err?.message}`)
    }
  }

  if (apply) console.log(`\nCreated ${created}, failed ${failed}`)
  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
