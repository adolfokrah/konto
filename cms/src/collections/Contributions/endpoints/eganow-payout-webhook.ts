import { PayloadRequest } from 'payload'

interface EganowPayoutWebhookPayload {
  TransactionId: string
  EganowTransRefNo: string
  TransactionStatus: string
  PayPartnerTransactionId: string
}

export const eganowPayoutWebhook = async (req: PayloadRequest) => {
  try {
    console.log('Eganow Payout Webhook Called ✅')
    if (!req.arrayBuffer) {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    const raw = Buffer.from(await req.arrayBuffer())
    const webhookData: EganowPayoutWebhookPayload = JSON.parse(raw.toString('utf8'))

    console.log('Eganow Payout Webhook Received:', webhookData)

    const { TransactionId, EganowTransRefNo, TransactionStatus, PayPartnerTransactionId } =
      webhookData

    // Validate required fields
    if (!TransactionId || !TransactionStatus) {
      console.error('Invalid payout webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the transfer contribution by TransactionId (which is the original contribution ID)
    const transferResult = await req.payload.find({
      collection: 'contributions',
      where: {
        linkedContribution: {
          equals: TransactionId,
        },
        type: {
          equals: 'transfer',
        },
      },
      limit: 1,
    })

    if (transferResult.docs.length === 0) {
      console.error(`Transfer not found for TransactionId: ${TransactionId}`)
      return Response.json({ error: 'Transfer not found' }, { status: 404 })
    }

    const transfer = transferResult.docs[0]

    // Only process webhook if transfer status is pending
    if (transfer.paymentStatus !== 'pending') {
      console.log(
        `Transfer ${transfer.id} status is ${transfer.paymentStatus}, not pending. Skipping update.`,
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

    console.log(`Updating transfer ${transfer.id} to status: ${newStatus}`)

    // Update transfer status
    await req.payload.update({
      collection: 'contributions',
      id: transfer.id,
      data: {
        paymentStatus: newStatus,
      },
    })

    // If payout is completed, mark the original contribution as transferred
    if (newStatus === 'completed') {
      // Get the linkedContribution from the transfer
      const linkedContributionId =
        typeof transfer.linkedContribution === 'string'
          ? transfer.linkedContribution
          : transfer.linkedContribution?.id

      if (linkedContributionId) {
        console.log(`Marking original contribution ${linkedContributionId} as transferred`)
        await req.payload.update({
          collection: 'contributions',
          id: linkedContributionId,
          data: {
            isTransferred: true,
          },
        })
        console.log(`Original contribution ${linkedContributionId} marked as transferred`)
      } else {
        console.error('LinkedContribution not found on transfer record')
      }
    }

    console.log(`Successfully updated transfer ${transfer.id} to ${newStatus}`)

    return new Response(null, { status: 200 })
  } catch (error: any) {
    console.error('Eganow payout webhook error:', error)
    return Response.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 },
    )
  }
}
