import { PayloadRequest } from 'payload'
import { payoutEganow } from './payout-eganow'

interface EganowWebhookPayload {
  TransactionId: string
  EganowReferenceNo: string
  TransactionStatus: string
  PayPartnerTransactionId: string
  redirectHtml?: string
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

    const { TransactionId, EganowReferenceNo, TransactionStatus, PayPartnerTransactionId } =
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

    const newStatus = statusMap[TransactionStatus.toUpperCase()] || 'failed'

    console.log(`Updating contribution ${TransactionId} to status: ${newStatus}`)

    // Update contribution status
    // Do NOT update transactionReference - it should remain consistent for mobile app verification
    await req.payload.update({
      collection: 'contributions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        // Keep the original transactionReference - don't change it
      },
    })

    // If type is contribution and status is completed, automatically initiate payout
    if (contribution.type === 'contribution' && newStatus === 'completed') {
      console.log(`Contribution ${TransactionId} completed, initiating automatic payout`)

      try {
        // Create a mock request object for the payout
        const payoutReq = {
          ...req,
          data: {
            contributionId: contribution.id,
          },
        }

        // Call the payout endpoint
        await payoutEganow(payoutReq as PayloadRequest)
        console.log(`Payout initiated successfully for contribution ${TransactionId}`)
      } catch (payoutError: any) {
        console.error(`Failed to initiate payout for contribution ${TransactionId}:`, payoutError)
        // Don't fail the webhook if payout fails - log it and continue
      }
    }

    console.log(`Successfully updated contribution ${TransactionId} to ${newStatus}`)
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
