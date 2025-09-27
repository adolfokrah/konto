import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { paystack } from '@/utilities/initalise'

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

      // const isTransfer = foundContribution.docs[0].type == 'transfer'
      await req.payload.update({
        collection: 'contributions',
        id: foundContribution.docs[0].id,
        data: {
          paymentStatus: (res.data as any)?.status === 'success' ? 'completed' : 'failed',
          contributorPhoneNumber:
            (res.data as any)?.customer?.phone || foundContribution.docs[0].contributorPhoneNumber,
        },
      })

      // if (isTransfer) {
      //   const linkedContribution = foundContribution.docs[0].linkedContribution
      //   const linkedContributionId =
      //     typeof linkedContribution === 'string' ? linkedContribution : linkedContribution?.id

      //   if (linkedContributionId && typeof linkedContributionId === 'string') {
      //     await req.payload.update({
      //       collection: 'contributions',
      //       id: linkedContributionId,
      //       data: {
      //         linkedTransfer: foundContribution.docs[0].id,
      //         isTransferred: true,
      //       },
      //     })
      //   }
      // }

      // if (!isTransfer && (res.data as any)?.status === 'success') {
      //   //insert a transfer transaction
      //   try {
      //     transferMomo({
      //       ...req,
      //       data: { contributionId: foundContribution.docs[0].id, testing: false },
      //     } as PayloadRequest)
      //   } catch (transferError: any) {
      //     return Response.json({
      //       success: false,
      //       message: transferError.message || 'Unknown error',
      //     })
      //     // Continue with verification success even if transfer fails
      //   }
      // }

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
