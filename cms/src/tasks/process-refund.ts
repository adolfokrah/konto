import { getPaystack } from '@/utilities/initalise'

const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VDF',
  vodafone: 'VDF',
  airteltigo: 'ATL',
}

/**
 * Process Refund Task
 *
 * Queued by the approve-refund endpoint. Sends money back to the
 * contributor's phone number via Paystack transfer API.
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
      const jarId = typeof refund.jar === 'string' ? refund.jar : (refund.jar as any)?.id
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

      const jar = await payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 0,
        overrideAccess: true,
      })

      if (!jar) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Jar not found' } }
      }

      const bankCode = bankCodeMap[(refund.mobileMoneyProvider || '').toLowerCase()]
      if (!bankCode) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      if (refundAmount < 1) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Refund amount is below minimum GHS 1.00' } }
      }

      try {
        const paystack = getPaystack()

        const recipient = await paystack.createTransferRecipient({
          type: 'mobile_money',
          name: refund.accountName,
          account_number: refund.accountNumber,
          bank_code: bankCode,
          currency: (jar.currency as string) || 'GHS',
        })

        const amountInPesewas = Math.round(refundAmount * 100)
        const transfer = await paystack.initiateTransfer({
          source: 'balance',
          amount: amountInPesewas,
          recipient: recipient.recipient_code,
          reason: `Refund for contribution to ${jar.name || 'jar'}`,
          currency: (jar.currency as string) || 'GHS',
          reference: refundId,
        })

        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { transactionReference: transfer.transfer_code },
          overrideAccess: true,
        })

        console.log(`✅ Refund initiated — transfer: ${transfer.transfer_code}`)

        return {
          output: {
            success: true,
            message: 'Refund initiated successfully',
            refundId,
            transferCode: transfer.transfer_code,
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
