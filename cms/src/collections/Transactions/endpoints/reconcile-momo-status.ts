import type { PayloadRequest } from 'payload'
import { getEganow } from '@/utilities/initalise'

const STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  SUCCESSFUL: 'completed',
  SUCCESS: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  AUTHENTICATION_IN_PROGRESS: 'pending',
  EXPIRED: 'failed',
  CANCELLED: 'failed',
}

/**
 * GET /api/transactions/reconcile-momo-status
 *
 * Query params:
 *   from   - start date ISO string (default: 2025-03-01)
 *   to     - end date ISO string (optional)
 *   update - "true" to apply DB changes, omit for dry-run
 */
export const reconcileMomoStatus = async (req: PayloadRequest) => {
  const url = new URL(req.url!)
  const from = url.searchParams.get('from') ?? '2025-03-01'
  const to = url.searchParams.get('to') ?? null
  const applyUpdate = url.searchParams.get('update') === 'true'

  const fromIso = new Date(`${from}T00:00:00.000Z`).toISOString()
  const toIso = to ? new Date(`${to}T23:59:59.999Z`).toISOString() : null

  try {
    await getEganow().getToken()

    // Fetch all mobile-money transactions in range (paginated)
    const allTransactions: any[] = []
    let page = 1

    while (true) {
      const where: Record<string, any> = {
        paymentMethod: { equals: 'mobile-money' },
        createdAt: { greater_than_equal: fromIso },
      }
      if (toIso) where.createdAt.less_than_equal = toIso

      const result = await req.payload.find({
        collection: 'transactions',
        where,
        limit: 200,
        page,
        depth: 0,
        overrideAccess: true,
      })

      allTransactions.push(...result.docs)
      if (page >= result.totalPages) break
      page++
    }

    const results: {
      id: string
      reference: string | null
      type: string
      dbStatus: string
      eganowStatus: string | null
      match: boolean
      action: string
      error?: string
    }[] = []

    let checkedCount = 0
    let mismatchCount = 0
    let updatedCount = 0
    let errorCount = 0
    const updatedIds: { id: string; from: string; to: string }[] = []

    for (const tx of allTransactions) {
      const { id, transactionReference, paymentStatus, type, collector, jar } = tx as any
      const eganowTransactionId: string = type === 'payout' ? `payout-${id}` : id

      const result = {
        id,
        reference: transactionReference ?? null,
        type: type ?? 'contribution',
        dbStatus: paymentStatus ?? 'unknown',
        eganowStatus: null as string | null,
        match: true,
        action: 'no-change',
        error: undefined as string | undefined,
      }

      if (!transactionReference) {
        result.action = 'skipped-no-reference'
        results.push(result)
        continue
      }

      try {
        // Re-auth every 100 requests
        if (checkedCount > 0 && checkedCount % 100 === 0) {
          await getEganow().getToken()
        }

        const statusResult = await getEganow().checkTransactionStatus({
          transactionId: eganowTransactionId,
          languageId: 'en',
        })

        if (!statusResult.isSuccess) {
          result.eganowStatus = 'not-found'
          result.match = paymentStatus === 'failed'
          result.action = `eganow-not-found: ${statusResult.message}`
          results.push(result)
          checkedCount++
          continue
        }

        const rawStatus = (
          statusResult.transStatus ||
          (statusResult as any).transactionstatus ||
          ''
        ).toUpperCase()

        const mappedStatus = STATUS_MAP[rawStatus] ?? 'pending'
        result.eganowStatus = rawStatus.toLowerCase()

        if (mappedStatus !== paymentStatus) {
          result.match = false
          mismatchCount++

          if (applyUpdate) {
            const collectorId = typeof collector === 'string' ? collector : collector?.id
            const jarId = typeof jar === 'string' ? jar : jar?.id

            await req.payload.update({
              collection: 'transactions',
              id,
              data: {
                paymentStatus: mappedStatus,
                ...(jarId ? { jar: jarId } : {}),
                ...(collectorId ? { collector: collectorId } : {}),
              },
              overrideAccess: true,
            })

            result.action = `updated → ${mappedStatus}`
            updatedCount++
            updatedIds.push({ id, from: paymentStatus, to: mappedStatus })
          } else {
            result.action = `would-update → ${mappedStatus}`
          }
        }

        checkedCount++
      } catch (err: any) {
        result.error = err.message
        result.action = 'error'
        errorCount++
        results.push(result)
      }

      if (result.action !== 'error') results.push(result)
    }

    return Response.json({
      success: true,
      dryRun: !applyUpdate,
      from,
      to: to ?? null,
      summary: {
        total: allTransactions.length,
        checked: checkedCount,
        mismatches: mismatchCount,
        skipped: results.filter((r) => r.action === 'skipped-no-reference').length,
        errors: errorCount,
        updated: updatedCount,
      },
      updatedTransactions: updatedIds,
      results,
    })
  } catch (err: any) {
    return Response.json(
      { success: false, message: err.message ?? 'Unknown error' },
      { status: 500 },
    )
  }
}
