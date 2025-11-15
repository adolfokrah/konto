import { PayloadRequest } from 'payload'

interface EganowWebhookPayload {
  TransactionId: string
  EganowTransRefNo: string
  TransactionStatus: string
  PayPartnerTransactionId: string
}

export const eganowWebhook = async (req: PayloadRequest) => {
  try {
    console.log('called here pleas ✅✅✅✅✅')
    if (!req.arrayBuffer) {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    const raw = Buffer.from(await req.arrayBuffer())
    const webhookData: EganowWebhookPayload = JSON.parse(raw.toString('utf8'))

    console.log('Eganow Webhook Received:', webhookData)

    const { TransactionId, EganowTransRefNo, TransactionStatus, PayPartnerTransactionId } =
      webhookData

    // Validate required fields
    if (!TransactionId || !TransactionStatus) {
      console.error('Invalid webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find contribution by TransactionId (which is the contribution ID)
    const contributionResult = await req.payload.find({
      collection: 'contributions',
      where: {
        id: {
          equals: TransactionId,
        },
      },
      limit: 1,
    })

    if (contributionResult.docs.length === 0) {
      console.error(`Contribution not found for TransactionId: ${TransactionId}`)
      return Response.json({ error: 'Contribution not found' }, { status: 404 })
    }

    const contribution = contributionResult.docs[0]

    // Check if contribution is already in a final state (completed or failed)
    if (contribution.paymentStatus === 'completed' || contribution.paymentStatus === 'failed') {
      console.log(
        `Contribution ${contribution.id} already in final state (${contribution.paymentStatus}), skipping update`,
      )
      return new Response(null, { status: 200 })
    }

    // Map Eganow status to our payment status
    const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
      SUCCESSFUL: 'completed',
      FAILED: 'failed',
      PENDING: 'pending',
    }

    const newStatus = statusMap[TransactionStatus.toUpperCase()] || 'failed'

    console.log(`Updating contribution ${TransactionId} to status: ${newStatus}`)

    // Update contribution status
    await req.payload.update({
      collection: 'contributions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        transactionReference: EganowTransRefNo || contribution.transactionReference,
      },
    })

    console.log(`Successfully updated contribution ${TransactionId} to ${newStatus}`)

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
