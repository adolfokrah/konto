import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { paystack } from '@/utilities/initalise'
import { verifyTransfer } from './verify-transfer'

// Helper function to retry on MongoDB write conflicts
async function retryOnWriteConflict<T>(
  operation: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 200,
): Promise<T> {
  let lastError: any
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      // Check if it's a MongoDB write conflict (code 112) or error name contains WriteConflict
      const isWriteConflict =
        error.code === 112 ||
        error.codeName === 'WriteConflict' ||
        error.message?.includes('Write conflict') ||
        error.message?.includes('WriteConflict')

      if (isWriteConflict && attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200
        console.log(
          `⚠️ Write conflict detected in verify-payment, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        lastError = error
        continue
      }
      // If not a write conflict or max retries reached, throw the error
      throw error
    }
  }
  throw lastError
}

export const verifyPayment = async (req: PayloadRequest) => {
  try {
    // Only call addDataAndFileToRequest if we don't already have data
    if (!req.data) {
      await addDataAndFileToRequest(req)
    }
    const { reference } = req.data || {}

    // Validate required fields
    if (!reference) {
      return Response.json(
        {
          success: false,
          message: 'Reference is required',
        },
        { status: 400 },
      )
    }

    let res
    try {
      res = await paystack.checkTransactionStatus(reference)
    } catch (paystackError: any) {
      // If transaction not found, update database status to failed
      if (paystackError.message && paystackError.message.toLowerCase().includes('not found')) {
        const data = await req.payload.update({
          collection: 'contributions',
          where: {
            transactionReference: { equals: reference },
          },
          data: {
            paymentStatus: 'failed',
          },
          limit: 1,
        })
        return Response.json({
          success: true,
          message: 'Transaction not found on Paystack, marked as failed',
          reference: reference,
          status: 'failed',
        })
      }

      throw new Error(`Paystack API failed: ${paystackError.message}`)
    }

    if (res.status && (res.data as any)?.status != 'ongoing') {
      const foundContribution = await req.payload.find({
        collection: 'contributions',
        where: {
          transactionReference: { equals: reference },
        },
        limit: 1,
      })

      if (foundContribution.docs.length === 0) {
        return Response.json(
          {
            success: false,
            message: 'Contribution not found',
          },
          { status: 404 },
        )
      }

      const contribution = foundContribution.docs[0]
      const newStatus = (res.data as any)?.status === 'success' ? 'completed' : 'failed'

      // Skip update if payment status is already set to the target status
      // This prevents race conditions when webhook and app both try to update
      if (contribution.paymentStatus === newStatus) {
        console.log(
          `Payment status already ${newStatus} for contribution ${contribution.id}, skipping update`,
        )
        return Response.json({
          success: true,
          data: res.data,
          message: 'Transaction already verified',
          alreadyProcessed: true,
        })
      }

      const channel = (res.data as any)?.channel
      const validPaymentMethods = ['mobile-money', 'bank', 'cash', 'card', 'apple-pay']

      // Only update payment method if we can map the channel to a valid payment method
      let updatedPaymentMethod = contribution.paymentMethod
      if (channel && typeof channel === 'string') {
        const mappedChannel = channel.replace('_', '-')
        if (validPaymentMethods.includes(mappedChannel)) {
          updatedPaymentMethod = mappedChannel as
            | 'mobile-money'
            | 'bank'
            | 'cash'
            | 'card'
            | 'apple-pay'
        }
      }

      // Use findOneAndUpdate with a where clause to ensure atomic update
      // This prevents race conditions when both webhook and app try to update
      const updateResult = await retryOnWriteConflict(() =>
        req.payload.update({
          collection: 'contributions',
          where: {
            and: [
              { id: { equals: contribution.id } },
              // Only update if payment status is NOT already the target status
              { paymentStatus: { not_equals: newStatus } },
            ],
          },
          data: {
            paymentStatus: newStatus,
            paymentMethod: updatedPaymentMethod,
            contributorPhoneNumber:
              contribution?.contributor?.toLocaleLowerCase() == 'anonymous'
                ? '-'
                : contribution?.contributorPhoneNumber,
          },
          limit: 1,
        }),
      )

      // Check if any document was actually updated
      if (updateResult.docs.length === 0) {
        console.log(
          `Payment status was already ${newStatus} for contribution ${contribution.id}, no update performed`,
        )
        return Response.json({
          success: true,
          data: res.data,
          message: 'Transaction already verified',
          alreadyProcessed: true,
        })
      }

      // create a transfer record if in using paystack test environment (simulation)
      if (process.env.PAYSTACK_SECRET?.includes('test')) {
        console.log('⚠️ Detected Paystack Test Environment, proceeding to create transfer record')
        // Await to ensure it completes (and surfaces any errors) before returning
        // Wrap verifyTransfer in retry logic as well
        await retryOnWriteConflict(() => verifyTransfer(req))
      }

      return Response.json({
        success: true,
        data: res.data,
        message: 'Transaction verified successfully',
      })
    } else if (res.status && (res.data as any)?.status === 'ongoing') {
      return Response.json({
        success: true,
        message: res.message || 'Pending verification',
        data: res.data,
      })
    } else {
      return Response.json(
        {
          success: false,
          message: res.message || 'Transaction verification failed',
          data: res.data,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.log(error)
    // Handle errors and return a meaningful response
    return Response.json(
      {
        success: false,
        message: 'Failed to verify payment',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
