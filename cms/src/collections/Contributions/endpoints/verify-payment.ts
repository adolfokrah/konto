import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { paystack } from '@/utilities/initalise'
import { verifyTransfer } from './verify-transfer'

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
      if (paystackError.message && paystackError.message.includes('not found')) {
        await req.payload.update({
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

      await req.payload.update({
        collection: 'contributions',
        id: foundContribution.docs[0].id,
        data: {
          paymentStatus: (res.data as any)?.status === 'success' ? 'completed' : 'failed',
        },
      })

      // create a transfer record if in using paystack test environment (simulation)
      if (process.env.PAYSTACK_SECRET?.includes('test')) {
        console.log('⚠️ Detected Paystack Test Environment, proceeding to create transfer record')
        // Await to ensure it completes (and surfaces any errors) before returning
        await verifyTransfer(req)
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
