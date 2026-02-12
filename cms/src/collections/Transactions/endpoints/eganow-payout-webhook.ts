import { PayloadRequest } from 'payload'
import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'
import Eganow from '@/utilities/eganow'

/**
 * Normalizes Eganow webhook payload to handle both camelCase and PascalCase field names.
 * The Eganow API responses use camelCase but the webhook callback format is undocumented.
 */
function normalizeWebhookPayload(data: Record<string, any>) {
  // Handle both success and failure responses
  // Success: { TransactionStatus, EganowReferenceNo, ... }
  // Failure: { Status: false, Message, TransactionId }
  const status = data['Status'] !== undefined ? data['Status'] : data['status']
  const transactionStatus =
    data['TransactionStatus'] ||
    data['transactionStatus'] ||
    (status === false ? 'failed' : status === true ? 'success' : '')

  return {
    transactionId: data['TransactionId'] || data['transactionId'] || '',
    eganowReferenceNo: data['EganowReferenceNo'] || data['eganowReferenceNo'] || '',
    transactionStatus,
    payPartnerTransactionId:
      data['PayPartnerTransactionId'] || data['payPartnerTransactionId'] || '',
    message: data['Message'] || data['message'] || '',
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

    const { transactionId, eganowReferenceNo, transactionStatus, message } =
      normalizeWebhookPayload(webhookData)

    // Validate required fields
    if (!transactionStatus || (!eganowReferenceNo && !transactionId)) {
      console.error('Invalid payout webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Find the payout record by Eganow reference number stored in transactionReference
    let transferResult = await req.payload.find({
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

    // Fallback: If not found by eganowReferenceNo, search by transaction ID extracted from transactionId
    // TransactionId format: "payout-{transactionId}"
    if (transferResult.docs.length === 0 && transactionId) {
      const transactionIdMatch = transactionId.match(/^payout-([a-f0-9]+)$/)
      if (transactionIdMatch) {
        const extractedTransactionId = transactionIdMatch[1]
        console.log(`Searching for payout by transaction ID: ${extractedTransactionId}`)

        transferResult = await req.payload.find({
          collection: 'transactions',
          where: {
            id: {
              equals: extractedTransactionId,
            },
            type: {
              equals: 'payout',
            },
          },
          limit: 1,
        })
      }
    }

    if (transferResult.docs.length === 0) {
      console.error(
        `Transfer not found for transactionId: ${transactionId}, eganowReferenceNo: ${eganowReferenceNo}`,
      )
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

    // Verify transaction status with Eganow API before updating
    console.log(`Verifying transaction with Eganow: ${transactionId}`)
    const eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
    })

    let verifiedStatus: string
    try {
      const statusResponse = await eganow.checkTransactionStatus({
        transactionId: transactionId,
        languageId: 'en',
      })

      console.log('Full Eganow status response:', JSON.stringify(statusResponse, null, 2))

      if (!statusResponse.isSuccess) {
        console.error(
          `Eganow status verification failed for ${transactionId}: ${statusResponse.message}`,
        )
        return Response.json(
          { error: 'Transaction verification failed', message: statusResponse.message },
          { status: 400 },
        )
      }

      verifiedStatus = statusResponse.transStatus
      console.log(`Verified transaction status from Eganow: ${verifiedStatus}`)

      // If transStatus is undefined, check for alternative field names
      if (!verifiedStatus) {
        console.error('transStatus is undefined. Full response:', statusResponse)
        // For now, trust the webhook status if we can't verify
        console.warn('Using webhook status as fallback:', transactionStatus)
        verifiedStatus = transactionStatus
      }

      // Check if webhook status matches verified status
      if (
        verifiedStatus &&
        transactionStatus &&
        verifiedStatus.toUpperCase() !== transactionStatus.toUpperCase()
      ) {
        console.warn(
          `Status mismatch! Webhook: ${transactionStatus}, Eganow API: ${verifiedStatus}. Using verified status.`,
        )
      }
    } catch (error: any) {
      console.error(`Failed to verify transaction with Eganow: ${error.message}`)
      return Response.json(
        { error: 'Failed to verify transaction', message: error.message },
        { status: 500 },
      )
    }

    // Map Eganow status to our payment status (use verified status)
    const statusMap: Record<string, 'transferred' | 'failed' | 'pending'> = {
      SUCCESSFUL: 'transferred',
      FAILED: 'failed',
      PENDING: 'pending',
      EXPIRED: 'failed',
      CANCELLED: 'failed',
    }

    const newStatus = statusMap[verifiedStatus?.toUpperCase() || 'FAILED'] || 'failed'

    console.log(
      `Updating transfer ${transfer.id} to status: ${newStatus}${message ? ` (${message})` : ''}`,
    )

    // Update transfer status
    await req.payload.update({
      collection: 'transactions',
      id: transfer.id,
      data: {
        paymentStatus: newStatus,
      },
    })

    // Send FCM notification to jar creator
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
      const creatorToken = typeof jar.creator === 'object' ? jar.creator?.fcmToken : null

      if (creatorToken) {
        const fcmNotifications = new FCMPushNotifications()
        const amount = `${jar.currency} ${Math.abs(Number(transferWithDetails.amountContributed)).toFixed(2)}`

        if (newStatus === 'transferred') {
          // Success notification
          const notificationMessage = `We sent you a transfer of ${amount} for "${jar.name}"`
          const title = 'Transfer Sent 💸'
          await fcmNotifications.sendNotification([creatorToken], notificationMessage, title, {
            type: 'payout',
            jarId: jar.id,
            transactionId: transfer.id,
          })
        } else if (newStatus === 'failed') {
          // Failure notification
          const notificationMessage = `Your transfer of ${amount} for "${jar.name}" failed${message ? `: ${message}` : ''}. Please try again.`
          const title = 'Transfer Failed ❌'
          await fcmNotifications.sendNotification([creatorToken], notificationMessage, title, {
            type: 'payout-failed',
            jarId: jar.id,
            transactionId: transfer.id,
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
