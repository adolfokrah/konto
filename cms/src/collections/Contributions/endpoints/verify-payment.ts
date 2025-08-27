import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { paystack } from '@/payload.config'

export const verifyPayment = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
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

    const res = await paystack.checkTransactionStatus(reference)

    if (res.status && (res.data as any)?.status === 'success') {
      const foundContribution = await req.payload.find({
        collection: 'contributions',
        where: {
          transactionReference: reference,
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

      const updated = await req.payload.update({
        collection: 'contributions',
        id: foundContribution.docs[0].id,
        data: {
          paymentStatus: 'completed',
        },
      })

      return Response.json({
        success: true,
        data: res.data,
        message: 'Transaction verified successfully',
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
