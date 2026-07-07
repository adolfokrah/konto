/**
 * One-off migration: move each user's single withdrawal account (bank/accountNumber/
 * accountHolder fields on the user) into a `withdrawal-accounts` record (as default),
 * and link every jar the user created to that account.
 *
 * Run from cms/:
 *   npx tsx scripts/migrate-withdrawal-accounts.ts          # dry-run
 *   npx tsx scripts/migrate-withdrawal-accounts.ts --apply  # apply
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const MOMO = new Set(['mtn', 'telecel'])

async function main() {
  const apply = process.argv.includes('--apply')
  const payload = await getPayload({ config })

  const users = await payload.find({
    collection: 'users',
    where: {
      and: [
        { bank: { exists: true } },
        { accountNumber: { exists: true } },
        { accountHolder: { exists: true } },
      ],
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  console.log(`Users with a legacy withdrawal account: ${users.totalDocs}`)
  let accountsCreated = 0
  let jarsLinked = 0

  for (const u of users.docs as any[]) {
    if (!u.bank || !u.accountNumber || !u.accountHolder) continue

    // Skip if this user already has a withdrawal account (idempotent).
    const existing = await payload.find({
      collection: 'withdrawal-accounts',
      where: { user: { equals: u.id } },
      limit: 1,
      overrideAccess: true,
    })
    let accountId: string | number | null = null
    if (existing.docs.length > 0) {
      accountId = existing.docs[0].id
    } else if (!apply) {
      console.log(`[dry] would create account for ${u.email ?? u.id} (${u.bank})`)
      accountsCreated++
      continue
    } else {
      const type = MOMO.has(String(u.bank).toLowerCase()) ? 'mobile-money' : 'bank'
      const acct = await payload.create({
        collection: 'withdrawal-accounts',
        data: {
          user: u.id,
          type,
          provider: u.bank,
          accountNumber: u.accountNumber,
          accountHolder: u.accountHolder,
          label:
            type === 'mobile-money'
              ? `${String(u.bank).toUpperCase()} · ${u.accountNumber}`
              : `${u.bank} · ${u.accountNumber}`,
          isDefault: true,
          verified: true,
        },
        overrideAccess: true,
      })
      accountId = acct.id
      accountsCreated++
    }

    if (!accountId) continue

    // Link the user's jars that have no withdrawal account yet.
    const jars = await payload.find({
      collection: 'jars',
      where: { and: [{ creator: { equals: u.id } }, { withdrawalAccount: { exists: false } }] },
      limit: 0,
      depth: 0,
      overrideAccess: true,
    })
    for (const jar of jars.docs as any[]) {
      if (!apply) {
        jarsLinked++
        continue
      }
      await payload.update({
        collection: 'jars',
        id: jar.id,
        data: { withdrawalAccount: accountId } as any,
        overrideAccess: true,
      })
      jarsLinked++
    }
  }

  console.log(
    `${apply ? 'Created' : '[dry] would create'} ${accountsCreated} accounts; ${
      apply ? 'linked' : 'would link'
    } ${jarsLinked} jars.`,
  )
  if (!apply) console.log('Re-run with --apply to perform the migration.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e?.message || e)
  process.exit(1)
})
