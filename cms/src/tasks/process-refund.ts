import { getEganow } from '@/utilities/initalise'

/**
 * Process Refund Task
 *
 * Queued by the approve-refund endpoint. Sends money back to the
 * contributor's phone number via Eganow payout API.
 * Works with the 'refunds' collection.
 */
export const processRefundTask = {
  slug: 'process-refund',
  inputSchema: [{ name: 'refundId', type: 'text', required: true }],
  handler: async (args: any) => {
    const payload = args.req?.payload || args.payload
    const { refundId } = args.input

    try {
      console.log(`🔄 Processing refund ${refundId}...`)

      // Fetch the refund record
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

      // Fetch the jar for currency info
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

      // Map provider
      const providerMap: Record<string, string> = {
        mtn: 'MTNGH',
        telecel: 'TCELGH',
      }

      const paypartner = providerMap[refund.mobileMoneyProvider.toLowerCase()]
      if (!paypartner) {
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })
        return { output: { success: false, message: 'Unsupported mobile money provider' } }
      }

      // Format phone number
      let phoneNumber = refund.accountNumber.replace(/\s+/g, '')
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '233' + phoneNumber.substring(1)
      } else if (!phoneNumber.startsWith('233')) {
        phoneNumber = '233' + phoneNumber
      }

      // Calculate fees
      const settings = await payload.findGlobal({
        slug: 'system-settings',
        overrideAccess: true,
      })

      const transferFeePercent = (settings.transferFeePercentage ?? 0) / 100
      const hogapayTransferFeePercent = settings.hogapayTransferFeePercent ?? 0.5
      const feeAmount = refundAmount * transferFeePercent
      const hogapayRevenue = (refundAmount * hogapayTransferFeePercent) / 100
      const eganowFees = feeAmount - hogapayRevenue

      // Update refund with calculated fees
      await payload.update({
        collection: 'refunds' as any,
        id: refundId,
        data: {
          eganowFees,
          hogapayRevenue,
        },
        overrideAccess: true,
      })

      try {
        // KYC lookup — get verified account name from Eganow
        let accountName = refund.accountName
        try {
          const kyc = await getEganow().verifyKYC({
            paypartnerCode: paypartner,
            accountNoOrCardNoOrMSISDN: phoneNumber,
            languageId: 'en',
            countryCode: 'GH',
          })
          if (kyc.isSuccess && kyc.accountName) {
            accountName = kyc.accountName
            console.log(`[process-refund] KYC name for ${phoneNumber}: ${accountName}`)
          } else {
            console.warn(`[process-refund] KYC lookup failed for ${phoneNumber}, using stored name`)
          }
        } catch (kycErr: any) {
          console.warn(`[process-refund] KYC error for ${phoneNumber}:`, kycErr?.message)
        }

        const payoutData = {
          paypartnerCode: paypartner,
          amount: String(refundAmount.toFixed(2)),
          accountNoOrCardNoOrMSISDN: phoneNumber,
          accountName,
          transactionId: `refund-${refundId}`,
          narration: `Refund for contribution to ${jar.name}`,
          transCurrencyIso: jar.currency || 'GHS',
          expiryDateMonth: 0,
          expiryDateYear: 0,
          cvv: '',
          languageId: 'en',
          callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
        }

        const payoutResult = await getEganow().payout(payoutData)
        console.log(
          `[process-refund] Eganow payout response for refund ${refundId}:`,
          JSON.stringify(payoutResult),
        )

        // Handle immediate failure from Eganow
        if (payoutResult.transactionStatus === 'FAILED') {
          await payload.update({
            collection: 'refunds' as any,
            id: refundId,
            data: { status: 'failed' },
            overrideAccess: true,
          })
          console.error(
            `❌ Eganow immediately rejected refund ${refundId}: ${payoutResult.message}`,
          )
          return {
            output: {
              success: false,
              message: `Eganow rejected: ${payoutResult.message}`,
              refundId,
            },
          }
        }

        // Update with Eganow reference
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { transactionReference: payoutResult.eganowReferenceNo },
          overrideAccess: true,
        })

        console.log(`✅ Refund initiated — ref: ${payoutResult.eganowReferenceNo}`)

        return {
          output: {
            success: true,
            message: 'Refund initiated successfully',
            refundId,
            eganowReferenceNo: payoutResult.eganowReferenceNo,
            amount: refundAmount,
          },
        }
      } catch (eganowError: any) {
        // Eganow call failed — mark refund as failed
        await payload.update({
          collection: 'refunds' as any,
          id: refundId,
          data: { status: 'failed' },
          overrideAccess: true,
        })

        console.error(`❌ Eganow refund failed for refund ${refundId}:`, eganowError)
        throw eganowError
      }
    } catch (error: any) {
      console.error(`❌ Refund task error for refund ${refundId}:`, error)
      return {
        output: {
          success: false,
          message: `Error: ${error.message}`,
        },
      }
    }
  },
}
