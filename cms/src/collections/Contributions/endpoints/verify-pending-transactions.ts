import { PayloadRequest } from 'payload'
import { verifyPayment } from './verify-payment'

export const verifyPendingTransactions = async (req: PayloadRequest) => {
  try {
    const pendingTransactions = await req.payload.find({
      collection: 'contributions',
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

    // console.log(pendingTransactions)

    let processedCount = 0
    let errorCount = 0
    const results = []

    for (const transaction of pendingTransactions.docs) {
      const { transactionReference, id } = transaction

      try {
        // Create a fresh request object for each transaction to avoid shared state issues
        const isolatedReq = {
          ...req,
          data: {
            reference: transactionReference,
          },
        } as PayloadRequest

        const result = await verifyPayment(isolatedReq)

        // Check if the response indicates the transaction was marked as failed
        const resultJson = await result.json()
        if (resultJson.status === 'failed') {
          results.push({
            transactionId: id,
            reference: transactionReference,
            status: 'failed',
            reason: 'Not found on Paystack',
          })
        } else {
          results.push({
            transactionId: id,
            reference: transactionReference,
            status: 'processed',
            result: 'success',
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
