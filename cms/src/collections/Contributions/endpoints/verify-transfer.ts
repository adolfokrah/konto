import { addDataAndFileToRequest, PayloadRequest } from 'payload'

// Verifies (or simulates) a transfer for a contribution. Can be called
// as an API endpoint handler OR internally from verifyPayment. We need
// to be careful not to re-consume the body stream if it was already parsed.
export const verifyTransfer = async (req: PayloadRequest) => {
  try {
    // Only parse the body if it hasn't already been parsed upstream
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

    const foundContributionResult = await req.payload.find({
      collection: 'contributions',
      where: {
        transactionReference: reference,
      },
      limit: 1,
    })

    if (foundContributionResult.docs.length === 0) {
      return Response.json(
        {
          success: false,
          message: 'No contribution found with provided reference',
        },
        { status: 404 },
      )
    }

    const contribution = foundContributionResult.docs[0]

    // If already transferred just return early
    if (contribution.isTransferred) {
      return Response.json({
        success: true,
        data: contribution,
        message: 'Contribution already marked as transferred',
      })
    }

    // Insert a transfer record linked to this contribution
    const transfer = await req.payload.create({
      collection: 'contributions',
      data: {
        ...foundContributionResult.docs[0],
        type: 'transfer',
        linkedContribution: contribution.id,
        paymentStatus: 'transferred',
        transactionReference: `transfer-${reference}`,
        viaPaymentLink: false,
        amountContributed: -contribution.amountContributed,
      },
    })

    // Update original contribution
    const updated = await req.payload.update({
      collection: 'contributions',
      id: contribution.id,
      data: {
        isTransferred: true,
        linkedTransfer: transfer.id,
      },
    })

    return Response.json({
      success: true,
      data: { ...updated, transfer },
      message: 'Transfer verified successfully',
    })
  } catch (error: any) {
    console.log('Error in verifyTransfer:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to verify transfer',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
