import { PayloadRequest } from 'payload'
import { getEganow } from '@/utilities/initalise'

export const verifyPendingTransactions = async (req: PayloadRequest) => {
  try {
    const pendingTransactions = await req.payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: {
          equals: 'pending',
        },
        paymentMethod: {
          equals: 'mobile-money',
        },
      },
      pagination: false,
    })

    let processedCount = 0
    let errorCount = 0
    const results = []

    for (const transaction of pendingTransactions.docs) {
      const { transactionReference, id, collector, jar } = transaction as any

      // Validate collector presence (required field). If missing, skip to avoid validation error on update.
      // If collector is missing (violates required field) we still want to force-mark this record as failed.
      if (!collector) {
        let forced = false
        try {
          // Attempt a direct DB-level update to bypass validation (best-effort)
          const anyReq: any = req as any
          if (
            typeof (anyReq.payload?.db as any)?.collections?.contributions?.updateOne === 'function'
          ) {
            const res = await (anyReq.payload.db as any).collections.transactions.updateOne(
              { _id: id },
              { $set: { paymentStatus: 'failed' } },
            )
            if (res?.modifiedCount > 0) forced = true
          }
        } catch (e) {
          // swallow
        }
        results.push({
          transactionId: id,
          reference: transactionReference,
          status: forced ? 'failed' : 'skipped',
          reason: forced
            ? 'Missing collector; force-marked as failed'
            : 'Missing collector; could not force-mark as failed',
        })
        if (!forced) errorCount++
        else processedCount++
        continue
      }

      if (!transactionReference) {
        try {
          // Extract IDs to satisfy relationship validation / filterOptions
          const collectorId = typeof collector === 'string' ? collector : collector?.id
          const jarId = typeof jar === 'string' ? jar : jar?.id
          await req.payload.update({
            collection: 'transactions',
            id,
            data: {
              paymentStatus: 'failed',
              // include existing relationships so filterOptions validation passes
              ...(jarId ? { jar: jarId } : {}),
              ...(collectorId ? { collector: collectorId } : {}),
            },
            overrideAccess: true,
            req,
          })
          results.push({
            transactionId: id,
            reference: transactionReference,
            status: 'failed',
            reason: 'No transaction reference',
          })
        } catch (e: any) {
          // Fallback: attempt raw DB update to set status failed even if validation blocks
          let fallbackSucceeded = false
          try {
            const anyReq: any = req as any
            if (
              typeof (anyReq.payload?.db as any)?.collections?.contributions?.updateOne ===
              'function'
            ) {
              const res = await (anyReq.payload.db as any).collections.transactions.updateOne(
                { _id: id },
                { $set: { paymentStatus: 'failed' } },
              )
              if (res?.modifiedCount > 0) fallbackSucceeded = true
            }
          } catch (_) {}

          results.push({
            transactionId: id,
            reference: transactionReference,
            status: fallbackSucceeded ? 'failed' : 'error',
            reason: fallbackSucceeded
              ? 'Validation blocked standard update; force-marked as failed'
              : 'Failed to mark as failed due to validation',
            error: fallbackSucceeded ? undefined : e.message,
          })
        }
        errorCount++
        continue
      }

      try {
        // Get token
        await getEganow().getToken()

        // Check transaction status directly with Eganow
        const statusResult = await getEganow().checkTransactionStatus({
          transactionId: id,
          languageId: 'en',
        })

        // Update contribution status
        const collectorId = typeof collector === 'string' ? collector : collector?.id
        const jarId = typeof jar === 'string' ? jar : jar?.id

        // If Eganow says transaction doesn't exist, mark as failed
        if (!statusResult.isSuccess) {
          await req.payload.update({
            collection: 'transactions',
            id,
            data: {
              paymentStatus: 'failed',
              ...(jarId ? { jar: jarId } : {}),
              ...(collectorId ? { collector: collectorId } : {}),
            },
            overrideAccess: true,
            req,
          })
          results.push({
            id,
            reference: transactionReference,
            status: 'failed',
            reason: statusResult.message,
          })
          errorCount++
          continue
        }

        // Map Eganow status to our payment status
        const rawStatus = (
          statusResult.transStatus ||
          statusResult.transactionstatus ||
          ''
        ).toUpperCase()

        const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
          SUCCESSFUL: 'completed',
          SUCCESS: 'completed',
          FAILED: 'failed',
          PENDING: 'pending',
        }

        const newStatus = statusMap[rawStatus] || 'pending'

        await req.payload.update({
          collection: 'transactions',
          id,
          data: {
            paymentStatus: newStatus,
            ...(jarId ? { jar: jarId } : {}),
            ...(collectorId ? { collector: collectorId } : {}),
          },
          overrideAccess: true,
          req,
        })

        if (newStatus === 'failed') {
          results.push({
            transactionId: id,
            reference: transactionReference,
            status: 'failed',
            reason: 'Transaction failed on Eganow',
          })
        } else {
          results.push({
            transactionId: id,
            reference: transactionReference,
            status: 'processed',
            result: newStatus,
          })
        }

        processedCount++
      } catch (error: any) {
        // Continue processing other transactions even if one fails
        results.push({
          transactionId: id,
          reference: transactionReference,
          status: 'error',
          error: error.message,
        })
        errorCount++
      }
    }
    const data = {
      success: true,
      message: 'Pending transactions processing completed',
      totalTransactions: pendingTransactions.docs.length,
      processedCount,
      errorCount,
      results,
    }
    return Response.json(data, { status: 200 })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'An error occurred while processing the mobile money charge',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
