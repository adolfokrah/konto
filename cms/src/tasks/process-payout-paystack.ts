import { getPaystack } from '@/utilities/initalise'
import { getJarBalance } from '@/utilities/getJarBalance'
import type { Transaction } from '@/payload-types'

const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VDF',
  vodafone: 'VDF',
  airteltigo: 'ATL',
}

/**
 * Process Paystack Payout Task
 *
 * Picks up a pending payout transaction and initiates a Paystack transfer
 * to the jar creator's registered mobile money account.
 */
export const processPayoutPaystackTask = {
  slug: 'process-payout-paystack',
  inputSchema: [{ name: 'existingTransactionId', type: 'text', required: true }],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { existingTransactionId } = args.input

    try {
      // Step 1 — fetch the transaction and confirm it is still pending
      let transaction: Transaction
      try {
        transaction = await payload.findByID({
          collection: 'transactions',
          id: existingTransactionId,
          overrideAccess: true,
          depth: 3,
        })
      } catch {
        return { output: { success: false, message: 'Transaction not found' } }
      }

      if (!transaction) {
        return { output: { success: false, message: 'Transaction not found' } }
      }

      if (transaction.paymentStatus !== 'pending') {
        console.warn(
          `⚠️ Transaction ${existingTransactionId} is already ${transaction.paymentStatus}, skipping`,
        )
        return {
          output: {
            success: false,
            message: `Transaction is already ${transaction.paymentStatus}`,
          },
        }
      }

      const jarId = typeof transaction.jar === 'string' ? transaction.jar : transaction.jar?.id

      console.log(
        `🔄 Processing Paystack payout for jar ${jarId}, transaction ${existingTransactionId}...`,
      )

      // Step 2 — safety net: deduplicate concurrent pending payouts for this jar
      const pendingPayouts = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { equals: 'pending' },
        },
        sort: 'createdAt',
        limit: 100,
        select: { id: true },
        overrideAccess: true,
      })

      if (pendingPayouts.totalDocs > 1) {
        const oldestId = pendingPayouts.docs[0]?.id

        if (existingTransactionId !== oldestId) {
          console.warn(
            `⚠️ Duplicate pending payout for jar ${jarId} — failing newer transaction ${existingTransactionId}, keeping oldest ${oldestId}`,
          )
          await payload.update({
            collection: 'transactions',
            id: existingTransactionId,
            data: { paymentStatus: 'failed' },
            overrideAccess: true,
          })
          return {
            output: {
              success: false,
              message:
                'Duplicate payout detected — only the oldest pending payout will be processed',
            },
          }
        }

        const duplicateIds = pendingPayouts.docs.slice(1).map((d: any) => d.id)
        await Promise.all(
          duplicateIds.map((dupId: string) =>
            payload.update({
              collection: 'transactions',
              id: dupId,
              data: { paymentStatus: 'failed' },
              overrideAccess: true,
            }),
          ),
        )
      }

      // Step 3 — fetch jar and validate
      const jar = await payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 1,
        overrideAccess: true,
      })

      if (!jar) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Jar not found' } }
      }

      if (jar.status === 'frozen') {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Jar is frozen' } }
      }

      // Step 3b — verify jar still has sufficient balance
      const { balance: currentBalance } = await getJarBalance(payload, jarId)
      const payoutAmount = Math.abs(transaction.amountContributed ?? 0)
      if (currentBalance < 0) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        console.warn(
          `❌ Payout ${existingTransactionId} rejected — jar balance (${currentBalance}) insufficient`,
        )
        return {
          output: {
            success: false,
            message: `Insufficient jar balance: available ${currentBalance + payoutAmount}, required ${payoutAmount}`,
          },
        }
      }

      // Step 4 — fetch jar creator's withdrawal account
      const creatorId = typeof jar.creator === 'object' ? (jar.creator as any).id : jar.creator
      let creator: any = typeof jar.creator === 'object' ? jar.creator : null
      if (!creator) {
        creator = await payload.findByID({
          collection: 'users',
          id: creatorId,
          overrideAccess: true,
        })
      }

      if (!creator?.bank || !creator?.accountNumber || !creator?.accountHolder) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return {
          output: { success: false, message: 'Creator has no withdrawal account set up' },
        }
      }

      const bankCode = bankCodeMap[creator.bank.toLowerCase()]
      if (!bankCode) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      // Step 5 — create Paystack transfer recipient
      try {
        const paystack = getPaystack()

        const recipient = await paystack.createTransferRecipient({
          type: 'mobile_money',
          name: creator.accountHolder,
          account_number: creator.accountNumber,
          bank_code: bankCode,
          currency: (jar.currency as string) || 'GHS',
        })

        // Step 6 — initiate transfer using the full payout amount (no fees deducted)
        const amountInPesewas = Math.round(payoutAmount * 100)
        const transfer = await paystack.initiateTransfer({
          source: 'balance',
          amount: amountInPesewas,
          recipient: recipient.recipient_code,
          reason: `Payout from ${jar.name || 'jar'}`,
          currency: (jar.currency as string) || 'GHS',
          reference: existingTransactionId,
        })

        // Step 7 — store Paystack transfer_code
        // Used by verify task via GET /transfer/:transfer_code
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { transactionReference: transfer.transfer_code },
          overrideAccess: true,
          context: { skipCharges: true },
        })

        console.log(
          `✅ Paystack payout initiated — transaction ${existingTransactionId}, transfer: ${transfer.transfer_code}`,
        )

        return {
          output: {
            success: true,
            message:
              transfer.status === 'otp'
                ? 'OTP required to complete transfer'
                : 'Payout initiated successfully',
            transactionId: existingTransactionId,
            transferCode: transfer.transfer_code,
          },
        }
      } catch (paystackError: any) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
          context: { skipCharges: true },
        })
        console.error(
          `❌ Paystack payout failed for transaction ${existingTransactionId}:`,
          paystackError,
        )
        throw paystackError
      }
    } catch (error: any) {
      console.error(
        `❌ Paystack payout task error for transaction ${existingTransactionId}:`,
        error,
      )
      return { output: { success: false, message: `Error: ${error.message}` } }
    }
  },
}
