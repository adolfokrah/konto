import { PayloadRequest } from 'payload'
import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'

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

export const eganowPayoutWebhook = async (req: PayloadRequest) => {
  try {
    console.log('Eganow Payout Webhook Called')
    if (!req.arrayBuffer) {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    const raw = Buffer.from(await req.arrayBuffer())
    const webhookData = JSON.parse(raw.toString('utf8'))

    console.log('Eganow Payout Webhook Received:', webhookData)

    const { transactionId, eganowReferenceNo, transactionStatus } =
      normalizeWebhookPayload(webhookData)

    // Validate required fields
    if (!transactionStatus || (!eganowReferenceNo && !transactionId)) {
      console.error('Invalid payout webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the payout record by Eganow reference number stored in transactionReference
    const transferResult = await req.payload.find({
      collection: 'transactions',
      where: {
        transactionReference: {
          equals: eganowReferenceNo,
        },
        type: {
          equals: 'payout',
        },
      },
      limit: 1,
    })

    if (transferResult.docs.length === 0) {
      console.error(`Transfer not found for transactionId: ${transactionId}`)
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
    const statusMap: Record<string, 'transferred' | 'failed' | 'pending'> = {
      SUCCESSFUL: 'transferred',
      FAILED: 'failed',
      PENDING: 'pending',
      EXPIRED: 'failed',
      CANCELLED: 'failed',
    }

    const newStatus = statusMap[transactionStatus.toUpperCase()] || 'failed'

    console.log(`Updating transfer ${transfer.id} to status: ${newStatus}`)

    // Update transfer status
    await req.payload.update({
      collection: 'transactions',
      id: transfer.id,
      data: {
        paymentStatus: newStatus,
      },
    })

    // If payout is completed, send FCM notification to jar creator
    if (newStatus === 'transferred') {
      // Fetch the transfer with jar details for notification
      const transferWithDetails = await req.payload.findByID({
        collection: 'transactions',
        id: transfer.id,
        depth: 2,
      })

      if (
        transferWithDetails &&
        typeof transferWithDetails.jar === 'object' &&
        transferWithDetails.jar
      ) {
        const jar = transferWithDetails.jar
        const message = `We sent you a transfer of ${jar.currency} ${Math.abs(Number(transferWithDetails.amountContributed)).toFixed(2)} for "${jar.name}"`
        const title = 'New Transfer Sent 💸'
        const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

        if (creatorToken) {
          const fcmNotifications = new FCMPushNotifications()
          await fcmNotifications.sendNotification([creatorToken], message, title, {
            type: 'contribution',
            jarId: jar.id,
            contributionId: transfer.id,
          })
        }
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
