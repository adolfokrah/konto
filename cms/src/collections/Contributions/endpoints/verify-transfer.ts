import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { fcmNotifications } from '@/utilities/fcmPushNotifications'

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

    // Fetch the jar details if not already populated
    let jar: any
    if (typeof contribution.jar === 'string') {
      // If jar is just an ID, fetch the full jar object
      const jarResult = await req.payload.findByID({
        collection: 'jars',
        id: contribution.jar,
      })
      jar = jarResult
    } else {
      // If jar is already populated, use it directly
      jar = contribution.jar
    }

    const message = `We sent you a transfer of ${jar.currency} ${Number(contribution.amountContributed).toFixed(2)} for "${jar.name}"`
    const title = 'New Transfer Sent 💸'
    const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

    // Note: Need to define validTokens and contribution object for FCM notification
    // This appears to be missing from the current implementation
    fcmNotifications.sendNotification([creatorToken], message, title, {
      type: 'contribution',
      jarId: jar.id,
      contributionId: transfer.id,
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
