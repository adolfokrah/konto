import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { paystack } from '@/payload.config'

import { transferMomo } from './transfer-momo'

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

      const isTransfer = foundContribution.docs[0].contributor == null

      await req.payload.update({
        collection: 'contributions',
        id: foundContribution.docs[0].id,
        data: {
          paymentStatus: isTransfer ? 'transferred' : 'completed',
        },
      })

      if (isTransfer) {
        const linkedContribution = foundContribution.docs[0].linkedContribution
        const linkedContributionId =
          typeof linkedContribution === 'string' ? linkedContribution : linkedContribution?.id

        if (linkedContributionId && typeof linkedContributionId === 'string') {
          await req.payload.update({
            collection: 'contributions',
            id: linkedContributionId,
            data: {
              linkedTransfer: foundContribution.docs[0].id,
              isTransferred: true,
            },
          })
        }
      }

      if (!isTransfer) {
        //insert a transfer transaction
        try {
          transferMomo({
            ...req,
            data: { contributionId: foundContribution.docs[0].id },
          } as PayloadRequest)
        } catch (transferError: any) {
          return Response.json({
            success: false,
            message: transferError.message || 'Unknown error',
          })
          // Continue with verification success even if transfer fails
        }
      }

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
