import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const verifyPaymentEgaNow = async (req: PayloadRequest) => {
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

    const foundContribution = await req.payload.find({
      collection: 'contributions',
      where: {
        transactionReference: { equals: reference },
      },
      limit: 1,
    })
    const contribution = foundContribution.docs[0]

    // Check if contribution exists
    if (!contribution) {
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
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

    // Return the current status of the contribution
    // The status is updated by the Eganow webhook
    return Response.json({
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
    })
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
