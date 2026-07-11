/**
 * Reset a user's password and unlock their account (clears lockout).
 *
 * Usage (from cms/):
 *   EMAIL=adolfokrah@gmail.com npx tsx scripts/reset-user.ts
 *
 * Generates a strong temporary password, prints it ONCE to the console.
 * Uses the Payload local API (talks straight to the DB — no running server needed).
 */

import 'dotenv/config'
import { randomBytes } from 'crypto'
import { getPayload } from 'payload'
import config from '../src/payload.config'

function generatePassword(): string {
  // 18 url-safe chars + guaranteed symbol/case/digit for any downstream policy
  const base = randomBytes(18).toString('base64url').slice(0, 18)
  return `A9!${base}`
}

async function main() {
  const email = (process.env.EMAIL || '').trim().toLowerCase()
  if (!email) {
    console.error('Set EMAIL env var, e.g. EMAIL=user@example.com npx tsx scripts/reset-user.ts')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  const user = found.docs[0]
  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  const newPassword = generatePassword()

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: newPassword },
    overrideAccess: true,
  })

  // Clear the failed-login lockout (loginAttempts / lockUntil)
  await payload.unlock({
    collection: 'users',
    data: { email } as any,
    overrideAccess: true,
  })

  console.log('\n─────────────────────────────────────────────')
  console.log(`Password reset + account unlocked for: ${email}`)
  console.log(`User ID: ${user.id}`)
  console.log(`Temporary password: ${newPassword}`)
  console.log('Share securely and instruct the user to change it after login.')
  console.log('─────────────────────────────────────────────\n')

  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err?.message || err)
  process.exit(1)
})
