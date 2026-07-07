import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getEganow } from '@/utilities/initalise'

// Eganow transaction status → internal payment status
const CARD_STATUS_MAP: Record<string, 'completed' | 'failed' | 'pending'> = {
  SUCCESSFUL: 'completed',
  SUCCESS: 'completed',
  APPROVED: 'completed',
  FAILED: 'failed',
  DECLINED: 'failed',
  EXPIRED: 'failed',
  CANCELLED: 'failed',
  PENDING: 'pending',
  AUTHENTICATION_IN_PROGRESS: 'pending',
  INITIATED: 'pending',
  PROCESSING: 'pending',
}

export const verifyPaymentEgaNow = async (req: PayloadRequest) => {
  try {
    // Only call addDataAndFileToRequest if we don't already have data
    if (!req.data) {
      await addDataAndFileToRequest(req)
    }
    const { reference } = req.data || {}

    console.log(`Verify Payment Eganow - Searching for reference: ${reference}`)

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

    const foundContribution = await req.payload.find({
      collection: 'transactions',
      where: {
        transactionReference: { equals: reference },
      },
      limit: 1,
    })

    console.log(`Verify Payment Eganow - Found ${foundContribution.docs.length} contributions`)

    const contribution = foundContribution.docs[0]

    // Check if contribution exists
    if (!contribution) {
      console.log(`Verify Payment Eganow - Contribution not found for reference: ${reference}`)
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
    }

    // Card payments have no reliable webhook when the transaction is frictionless
    // (no 3DS challenge page renders, so nothing calls our callback). Resolve the status
    // by polling Eganow's status API directly while the card payment is still pending.
    if (contribution.paymentMethod === 'card' && contribution.paymentStatus === 'pending') {
      try {
        const statusResp = await getEganow().checkTransactionStatus({
          transactionId: String(contribution.id),
          languageId: 'en',
        })
        if (statusResp.isSuccess) {
          const apiStatus = (
            statusResp.transStatus ||
            statusResp.transactionstatus ||
            ''
          ).toUpperCase()
          const newStatus = CARD_STATUS_MAP[apiStatus]
          if (newStatus && newStatus !== 'pending') {
            await req.payload.update({
              collection: 'transactions',
              id: contribution.id,
              data: { paymentStatus: newStatus },
              overrideAccess: true,
              context: { skipCharges: true },
            })
            contribution.paymentStatus = newStatus
          }
        }
      } catch (err: any) {
        // Keep pending; the next poll (or the verify-pending task) will retry.
        console.warn(`[verify-payment] card status check failed: ${err?.message}`)
      }
    }

    // Map payment status to mobile app expected format
    // completed -> success, pending -> pay_offline, failed -> failed
    const statusMap: { [key: string]: string } = {
      completed: 'success',
      pending: 'pay_offline',
      failed: 'failed',
    }

    const mappedStatus =
      (contribution.paymentStatus && statusMap[contribution.paymentStatus]) || 'failed'

    const responseData = {
      success: true,
      data: {
        status: mappedStatus,
        reference: contribution.transactionReference,
        contributionId: contribution.id,
      },
      message:
        contribution.paymentStatus === 'completed'
          ? 'Payment completed'
          : contribution.paymentStatus === 'failed'
            ? 'Payment failed'
            : 'Payment pending',
    }

    console.log('Verify Payment Eganow - Response:', JSON.stringify(responseData))

    // Return the current status of the contribution
    // The status is updated by the Eganow webhook
    return Response.json(responseData)
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
