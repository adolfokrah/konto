import { PayloadRequest } from 'payload'

/**
 * Normalizes Eganow webhook payload to handle both camelCase and PascalCase field names.
 * The Eganow API responses use camelCase but the webhook callback format is undocumented.
 */
function normalizeWebhookPayload(data: Record<string, any>) {
  return {
    transactionId: data['TransactionId'] || data['transactionId'] || '',
    eganowReferenceNo: data['EganowReferenceNo'] || data['eganowReferenceNo'] || '',
    transactionStatus: data['TransactionStatus'] || data['transactionStatus'] || '',
    payPartnerTransactionId:
      data['PayPartnerTransactionId'] || data['payPartnerTransactionId'] || '',
  }
}

export const eganowWebhook = async (req: PayloadRequest) => {
  try {
    console.log('Eganow Collection Webhook Called')
    if (!req.arrayBuffer) {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    const raw = Buffer.from(await req.arrayBuffer())
    const webhookData = JSON.parse(raw.toString('utf8'))

    console.log('Eganow Webhook Received:', webhookData)

    const { transactionId, transactionStatus } = normalizeWebhookPayload(webhookData)

    // Validate required fields
    if (!transactionId || !transactionStatus) {
      console.error('Invalid webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find contribution by transactionId (which is the contribution ID)
    const contributionResult = await req.payload.find({
      collection: 'transactions',
      where: {
        id: {
          equals: transactionId,
        },
      },
      limit: 1,
    })

    if (contributionResult.docs.length === 0) {
      console.error(`Contribution not found for transactionId: ${transactionId}`)
      return Response.json({ error: 'Contribution not found' }, { status: 404 })
    }

    const contribution = contributionResult.docs[0]

    // Only process webhook if contribution status is pending
    if (contribution.paymentStatus !== 'pending') {
      console.log(
        `Contribution ${contribution.id} status is ${contribution.paymentStatus}, not pending. Skipping update.`,
      )
      return new Response(null, { status: 200 })
    }

    // Map Eganow status to our payment status
    const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
      SUCCESSFUL: 'completed',
      FAILED: 'failed',
      PENDING: 'pending',
      AUTHENTICATION_IN_PROGRESS: 'pending',
      EXPIRED: 'failed',
      CANCELLED: 'failed',
    }

    const newStatus = statusMap[transactionStatus.toUpperCase()] || 'failed'

    console.log(`Updating contribution ${transactionId} to status: ${newStatus}`)

    // Update contribution status
    // Do NOT update transactionReference - it should remain consistent for mobile app verification
    await req.payload.update({
      collection: 'transactions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        // Keep the original transactionReference - don't change it
      },
    })

    console.log(`Successfully updated contribution ${transactionId} to ${newStatus}`)
    console.log(`Original reference maintained: ${contribution.transactionReference}`)

    return new Response(null, { status: 200 })
  } catch (error: any) {
    console.error('Eganow webhook error:', error)
    return Response.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 },
    )
  }
}
