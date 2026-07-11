/**
 * Set a user's kybStatus (for testing the KYB gate).
 *   EMAIL=you@example.com STATUS=none npx tsx scripts/set-kyb-status.ts
 * STATUS ∈ none | in_review | approved | rejected  (default: none)
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

async function main() {
  const email = (process.env.EMAIL || '').trim().toLowerCase()
  const status = (process.env.STATUS || 'none').trim()
  if (!email) {
    console.error('Set EMAIL env var')
    process.exit(1)
  }
  const p = await getPayload({ config })
  const found = await p.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })
  const user = found.docs[0]
  if (!user) {
    console.error(`No user with email ${email}`)
    process.exit(1)
  }
  await p.update({
    collection: 'users',
    id: user.id,
    data: { kybStatus: status as any },
    overrideAccess: true,
  })
  console.log(`Set ${email} kybStatus=${status}`)
  process.exit(0)
}
main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
