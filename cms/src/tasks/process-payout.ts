import { getEganow } from '@/utilities/initalise'
import { getJarBalance } from '@/utilities/getJarBalance'
import type { Transaction } from '@/payload-types'

/**
 * Process Payout Task
 *
 * Only input needed is the transaction ID — all account details are derived
 * from the transaction and the jar's creator record.
 */
export const processPayoutTask = {
  slug: 'process-payout',
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

      console.log(`🔄 Processing payout for jar ${jarId}, transaction ${existingTransactionId}...`)

      // Step 2 — safety net: ensure there is exactly one pending payout for this jar.
      // Fetch ALL pending payouts sorted oldest-first so we can pick a winner when
      // two tasks run concurrently and both see duplicates.
      const pendingPayouts = await payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { equals: 'pending' },
        },
        sort: 'createdAt', // oldest first
        limit: 100,
        select: { id: true },
        overrideAccess: true,
      })

      if (pendingPayouts.totalDocs > 1) {
        const oldestId = pendingPayouts.docs[0]?.id

        if (existingTransactionId !== oldestId) {
          // This task is processing a duplicate — fail it and let the oldest proceed
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

        // This task IS the oldest — fail all newer duplicates and proceed
        console.warn(
          `⚠️ Multiple pending payouts for jar ${jarId} — this task holds oldest (${existingTransactionId}), failing ${pendingPayouts.totalDocs - 1} duplicate(s)`,
        )
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

      // Step 3 — fetch jar and creator account details
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

      // Step 3b — verify jar still has sufficient balance to cover this payout
      const { balance: currentBalance } = await getJarBalance(payload, jarId)
      const payoutAmount = Math.abs(transaction.amountContributed ?? 0)
      if (currentBalance < payoutAmount) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        console.warn(
          `❌ Payout ${existingTransactionId} rejected — jar balance (${currentBalance}) is less than payout amount (${payoutAmount})`,
        )
        return {
          output: {
            success: false,
            message: `Insufficient jar balance: available ${currentBalance}, required ${payoutAmount}`,
          },
        }
      }

      // Fetch creator — jar loaded with depth:1 so creator should be populated,
      // but fall back to a direct lookup if it came back as a bare ID
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

      const userBank = creator.bank
      const userAccountNumber = creator.accountNumber
      const userAccountHolder = creator.accountHolder

      // Step 4 — map provider and format phone
      const providerMap: Record<string, string> = { mtn: 'MTNGH', telecel: 'TCELGH' }
      const paypartner = providerMap[userBank?.toLowerCase()]
      if (!paypartner) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      let phoneNumber = userAccountNumber.replace(/\s+/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '233' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('233')) {
        phoneNumber = '233' + phoneNumber
      }

      const grossAmount = payoutAmount

      // Step 5 — call Eganow
      try {
        const payoutResult = await getEganow().payout({
          paypartnerCode: paypartner,
          amount: String(grossAmount.toFixed(2)),
          accountNoOrCardNoOrMSISDN: phoneNumber,
          accountName: userAccountHolder,
          transactionId: `payout-${existingTransactionId}`,
          narration: `Payout for jar ${jar.name}`,
          transCurrencyIso: jar.currency || 'GHS',
          expiryDateMonth: 0,
          expiryDateYear: 0,
          cvv: '',
          languageId: 'en',
          callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
        })

        // Step 6 — update transaction with Eganow reference
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { transactionReference: payoutResult.eganowReferenceNo },
          overrideAccess: true,
        })

        console.log(
          `✅ Payout initiated — transaction ${existingTransactionId}, ref: ${payoutResult.eganowReferenceNo}`,
        )

        return {
          output: {
            success: true,
            message: 'Payout initiated successfully',
            transactionId: existingTransactionId,
            eganowReferenceNo: payoutResult.eganowReferenceNo,
          },
        }
      } catch (eganowError: any) {
        await payload.update({
          collection: 'transactions',
          id: existingTransactionId,
          data: { paymentStatus: 'failed' },
          overrideAccess: true,
        })
        console.error(
          `❌ Eganow payout failed for transaction ${existingTransactionId}:`,
          eganowError,
        )
        throw eganowError
      }
    } catch (error: any) {
      console.error(`❌ Payout task error for transaction ${existingTransactionId}:`, error)
      return { output: { success: false, message: `Error: ${error.message}` } }
    }
  },
}
