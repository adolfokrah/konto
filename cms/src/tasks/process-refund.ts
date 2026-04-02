import { getPaystack } from '@/utilities/initalise'

/**
 * Process Refund Task
 *
 * Queued by the approve-refund endpoint. Uses Paystack's refund API to
 * reverse the original contribution charge back to the contributor.
 */
export const processRefundTask = {
  slug: 'process-refund',
  inputSchema: [{ name: 'refundId', type: 'text', required: true }],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { refundId } = args.input

    try {
      console.log(`🔄 Processing refund ${refundId}...`)

      const refund = await payload.findByID({
        collection: 'refunds' as any,
        id: refundId,
        depth: 0,
        overrideAccess: true,
      })

      if (!refund) {
        return { output: { success: false, message: 'Refund not found' } }
      }

      if (refund.status !== 'in-progress') {
        return {
          output: {
            success: false,
            message: `Refund status is ${refund.status}, expected in-progress`,
          },
        }
      }

      const refundAmount = Math.abs(Number(refund.amount))
      const linkedTransactionId =
        typeof refund.linkedTransaction === 'string'
          ? refund.linkedTransaction
          : (refund.linkedTransaction as any)?.id

      if (!linkedTransactionId) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'No linked transaction on refund' } }
      }

      const linkedTx = await payload.findByID({
        collection: 'transactions',
        id: linkedTransactionId,
        overrideAccess: true,
        depth: 0,
      })

      if (!linkedTx) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Linked transaction not found' } }
      }

      if (linkedTx.type !== 'contribution') {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return {
          output: {
            success: false,
            message: `Linked transaction is not a contribution (type: ${linkedTx.type})`,
          },
        }
      }

      if (linkedTx.paymentStatus !== 'completed') {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return {
          output: {
            success: false,
            message: `Linked transaction is not completed (status: ${linkedTx.paymentStatus})`,
          },
        }
      }

      const originalReference = linkedTx.transactionReference as string
      if (!originalReference) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return {
          output: {
            success: false,
            message: 'Original Paystack transaction reference not found on linked transaction',
          },
        }
      }

      // Check for duplicate refund
      const existingRefunds = await payload.find({
        collection: 'refunds' as any,
        where: {
          linkedTransaction: { equals: linkedTransactionId },
          status: { in: ['completed', 'in-progress'] },
          id: { not_equals: refundId },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (existingRefunds.totalDocs > 0) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return {
          output: {
            success: false,
            message: 'A refund for this transaction already exists or is in progress',
          },
        }
      }

      try {
        const paystack = getPaystack()

        // Amount in pesewas; omit for full refund
        const amountInPesewas = Math.round(refundAmount * 100)

        const result = await paystack.refund({
          transaction: originalReference,
          amount: amountInPesewas,
        })

        // Store Paystack refund ID as transactionReference for status polling
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { transactionReference: String(result.id) },
          overrideAccess: true,
        })

        console.log(
          `✅ Paystack refund initiated — refund ID: ${result.id}, status: ${result.status}`,
        )

        return {
          output: {
            success: true,
            message: 'Refund initiated successfully',
            refundId,
            paystackRefundId: result.id,
            status: result.status,
            amount: refundAmount,
          },
        }
      } catch (paystackError: any) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        console.error(`❌ Paystack refund failed for refund ${refundId}:`, paystackError)
        throw paystackError
      }
    } catch (error: any) {
      console.error(`❌ Refund task error for refund ${refundId}:`, error)
      return { output: { success: false, message: `Error: ${error.message}` } }
    }
  },
}
