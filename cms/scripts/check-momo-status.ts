/**
 * Eganow Mobile Money Status Reconciliation Script
 *
 * Checks every mobile-money transaction from 1st March onwards against the
 * Eganow API and reports discrepancies between the local DB and Eganow.
 *
 * Usage (run from the cms/ directory):
 *
 *   # Dry-run (report only, no DB changes):
 *   npx tsx scripts/check-momo-status.ts
 *
 *   # Apply updates (set DB status to match Eganow):
 *   npx tsx scripts/check-momo-status.ts --update
 *
 *   # Check a specific date range:
 *   FROM=2025-04-01 TO=2025-04-30 npx tsx scripts/check-momo-status.ts
 *
 * Required env vars (in cms/.env):
 *   SERVER_URL                - e.g. https://api.hogapay.com
 *   PAYLOAD_ADMIN_EMAIL       - admin user email
 *   PAYLOAD_ADMIN_PASSWORD    - admin user password
 *   EGANOW_SECRET_USERNAME
 *   EGANOW_SECRET_PASSWORD
 *   EGANOW_X_AUTH_TOKEN
 */

import 'dotenv/config'

const FROM_DATE = process.env.FROM ?? '2025-03-01'
const TO_DATE = process.env.TO ?? null
const DRY_RUN = !process.argv.includes('--update')

const SERVER_URL = (process.env.SERVER_URL ?? process.env.NEXT_PUBLIC_SERVER_URL ?? '').replace(
  /\/+$/,
  '',
)
const EGANOW_BASE = 'https://developer.deveganowapi.com'

const STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  SUCCESSFUL: 'completed',
  SUCCESS: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  AUTHENTICATION_IN_PROGRESS: 'pending',
  EXPIRED: 'failed',
  CANCELLED: 'failed',
}

// ── Payload REST helpers ─────────────────────────────────────────────────────

async function payloadLogin(): Promise<string> {
  const res = await fetch(`${SERVER_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.PAYLOAD_ADMIN_EMAIL,
      password: process.env.PAYLOAD_ADMIN_PASSWORD,
    }),
  })
  if (!res.ok) throw new Error(`Payload login failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  if (!data.token) throw new Error('Payload login returned no token')
  return data.token as string
}

async function fetchTransactions(token: string): Promise<any[]> {
  const all: any[] = []
  let page = 1

  const fromIso = new Date(`${FROM_DATE}T00:00:00.000Z`).toISOString()
  const toIso = TO_DATE ? new Date(`${TO_DATE}T23:59:59.999Z`).toISOString() : null

  while (true) {
    const params = new URLSearchParams({
      'where[paymentMethod][equals]': 'mobile-money',
      'where[createdAt][greater_than_equal]': fromIso,
      limit: '200',
      page: String(page),
      depth: '0',
    })
    if (toIso) params.set('where[createdAt][less_than_equal]', toIso)

    const res = await fetch(`${SERVER_URL}/api/transactions?${params}`, {
      headers: { Authorization: `JWT ${token}` },
    })
    if (!res.ok) throw new Error(`Failed to fetch transactions page ${page}: ${res.status}`)

    const data = await res.json()
    all.push(...data.docs)

    console.log(
      `  Fetched page ${page}/${data.totalPages} — ${all.length}/${data.totalDocs} transactions`,
    )

    if (page >= data.totalPages) break
    page++
  }

  return all
}

async function updateTransaction(token: string, id: string, paymentStatus: string): Promise<void> {
  const res = await fetch(`${SERVER_URL}/api/transactions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify({ paymentStatus }),
  })
  if (!res.ok)
    throw new Error(`PATCH /api/transactions/${id} failed: ${res.status} ${await res.text()}`)
}

// ── Eganow helpers ───────────────────────────────────────────────────────────

async function eganowGetToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.EGANOW_SECRET_USERNAME}:${process.env.EGANOW_SECRET_PASSWORD}`,
  ).toString('base64')

  const res = await fetch(`${EGANOW_BASE}/api/auth/token`, {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!res.ok) throw new Error(`Eganow auth failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  if (!data.isSuccess || !data.developerJwtToken)
    throw new Error(`Eganow auth error: ${data.message}`)

  return data.developerJwtToken as string
}

async function eganowCheckStatus(
  eganowToken: string,
  transactionId: string,
): Promise<{ isSuccess: boolean; rawStatus: string; message: string }> {
  const res = await fetch(`${EGANOW_BASE}/api/transactions/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${eganowToken}`,
      'x-Auth': process.env.EGANOW_X_AUTH_TOKEN!,
    },
    body: JSON.stringify({ transactionId, languageId: 'en' }),
  })

  if (!res.ok) throw new Error(`Eganow status check failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  const rawStatus = ((data.transStatus || data.transactionstatus || '') as string).toUpperCase()

  return { isSuccess: data.isSuccess, rawStatus, message: data.message ?? '' }
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface Result {
  id: string
  reference: string | null
  type: string
  dbStatus: string
  eganowStatus: string | null
  match: boolean
  action: string
  error?: string
}

async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log('  Eganow Mobile Money Status Reconciliation')
  console.log(`${'='.repeat(60)}`)
  console.log(`  From   : ${FROM_DATE}`)
  console.log(`  To     : ${TO_DATE ?? '(now)'}`)
  console.log(`  Server : ${SERVER_URL}`)
  console.log(`  Mode   : ${DRY_RUN ? 'DRY RUN (no changes)' : '⚠️  LIVE UPDATE'}`)
  console.log(`${'='.repeat(60)}\n`)

  if (!SERVER_URL) throw new Error('SERVER_URL or NEXT_PUBLIC_SERVER_URL env var is required')

  // Authenticate
  const payloadToken = await payloadLogin()
  console.log('✅ Payload token obtained')

  let eganowToken = await eganowGetToken()
  console.log('✅ Eganow token obtained\n')

  // Fetch transactions
  const transactions = await fetchTransactions(payloadToken)
  console.log(`\n  Total to check: ${transactions.length}\n`)
  console.log(`${'─'.repeat(60)}\n`)

  const results: Result[] = []
  let checkedCount = 0
  let mismatchCount = 0
  let updatedCount = 0
  let errorCount = 0

  for (const tx of transactions) {
    const { id, transactionReference, paymentStatus, type } = tx
    const eganowTransactionId: string = type === 'payout' ? `payout-${id}` : id

    const result: Result = {
      id,
      reference: transactionReference ?? null,
      type: type ?? 'contribution',
      dbStatus: paymentStatus ?? 'unknown',
      eganowStatus: null,
      match: true,
      action: 'no-change',
    }

    if (!transactionReference) {
      result.action = 'skipped-no-reference'
      results.push(result)
      continue
    }

    try {
      // Re-auth every 100 requests
      if (checkedCount > 0 && checkedCount % 100 === 0) {
        eganowToken = await eganowGetToken()
      }

      const { isSuccess, rawStatus, message } = await eganowCheckStatus(
        eganowToken,
        eganowTransactionId,
      )

      if (!isSuccess) {
        result.eganowStatus = 'not-found'
        result.match = paymentStatus === 'failed'
        result.action = `eganow-not-found: ${message}`
        results.push(result)
        checkedCount++
        continue
      }

      const mappedStatus = STATUS_MAP[rawStatus] ?? 'pending'
      result.eganowStatus = rawStatus.toLowerCase()

      if (mappedStatus !== paymentStatus) {
        result.match = false
        mismatchCount++

        if (!DRY_RUN) {
          await updateTransaction(payloadToken, id, mappedStatus)
          result.action = `updated → ${mappedStatus}`
          updatedCount++
        } else {
          result.action = `would-update → ${mappedStatus}`
        }
      }

      checkedCount++
    } catch (err: any) {
      result.error = err.message
      result.action = 'error'
      errorCount++
    }

    results.push(result)
  }

  // ── Print table ──────────────────────────────────────────────────────────────
  console.log('\nResults:\n')
  console.log(
    `${'ID'.padEnd(28)} ${'Type'.padEnd(13)} ${'DB'.padEnd(10)} ${'Eganow'.padEnd(15)} ${'Match'.padEnd(6)} Action`,
  )
  console.log('─'.repeat(100))

  for (const r of results) {
    console.log(
      [
        r.id.padEnd(28),
        (r.type ?? '').padEnd(13),
        (r.dbStatus ?? '').padEnd(10),
        (r.eganowStatus ?? 'n/a').padEnd(15),
        (r.match ? '✓' : '✗').padEnd(6),
        r.action + (r.error ? ` (${r.error})` : ''),
      ].join(' '),
    )
  }

  console.log('\n' + '─'.repeat(100))
  console.log('\nSummary:')
  console.log(`  Total      : ${transactions.length}`)
  console.log(`  Checked    : ${checkedCount}`)
  console.log(`  Mismatches : ${mismatchCount}`)
  console.log(`  Skipped    : ${results.filter((r) => r.action === 'skipped-no-reference').length}`)
  console.log(`  Errors     : ${errorCount}`)

  if (DRY_RUN && mismatchCount > 0) {
    console.log(`\n  ⚠️  ${mismatchCount} mismatch(es). Re-run with --update to apply corrections.`)
  }
  if (!DRY_RUN) {
    console.log(`  Updated    : ${updatedCount}`)
  }

  console.log()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
