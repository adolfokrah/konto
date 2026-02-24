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

    // Verify transaction with Eganow API (with retry for propagation delay)
    console.log(`Verifying transaction with Eganow: ${transactionId}`)
    const eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
    })

    const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
      SUCCESSFUL: 'completed',
      SUCCESS: 'completed',
      FAILED: 'failed',
      PENDING: 'pending',
      EXPIRED: 'failed',
      CANCELLED: 'failed',
      INITIATED: 'pending',
      PROCESSING: 'pending',
    }

    const nonFinalStatuses = ['INITIATED', 'PROCESSING', 'PENDING']
    const maxRetries = 3
    const retryDelayMs = 5000 // 5 seconds between retries
    let verifiedStatus = ''

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          console.log(
            `Retry ${attempt}/${maxRetries} — waiting ${retryDelayMs / 1000}s for API to propagate...`,
          )
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
        }

        const statusResponse = await eganow.checkTransactionStatus({
          transactionId: transactionId,
          languageId: 'en',
        })

        console.log(
          `Attempt ${attempt} Eganow status response:`,
          JSON.stringify(statusResponse, null, 2),
        )

        if (!statusResponse.isSuccess) {
          console.error(
            `Eganow does not recognize transaction ${transactionId}: ${statusResponse.message}`,
          )
          return Response.json(
            { error: 'Transaction not found in Eganow', message: statusResponse.message },
            { status: 400 },
          )
        }

        // Verify reference number matches to prevent spoofing
        const apiRef = statusResponse.referenceNo || ''
        if (apiRef && eganowReferenceNo && apiRef !== eganowReferenceNo) {
          console.error(
            `Reference mismatch! Webhook: ${eganowReferenceNo}, Eganow API: ${apiRef}. Possible spoofed webhook.`,
          )
          return Response.json({ error: 'Reference number mismatch' }, { status: 400 })
        }

        verifiedStatus = statusResponse.transStatus || statusResponse.transactionstatus || ''
        console.log(
          `Attempt ${attempt} — Eganow API status: ${verifiedStatus}, Webhook status: ${transactionStatus}`,
        )

        // If we got a final status, stop retrying
        if (!nonFinalStatuses.includes(verifiedStatus.toUpperCase())) {
          break
        }

        // If still non-final on last attempt, use webhook status as final fallback
        if (attempt === maxRetries) {
          console.warn(
            `API still says ${verifiedStatus} after ${maxRetries} attempts. Using webhook status: ${transactionStatus}`,
          )
          verifiedStatus = transactionStatus
        }
      } catch (error: any) {
        console.error(`Attempt ${attempt} — Failed to verify with Eganow: ${error.message}`)
        if (attempt === maxRetries) {
          return Response.json(
            { error: 'Failed to verify transaction', message: error.message },
            { status: 500 },
          )
        }
      }
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
        const grossAmount = Math.abs(Number(transferWithDetails.amountContributed))

        // Get fee information from transaction
        const feePercentage = transferWithDetails.payoutFeePercentage || 1
        const netAmount = transferWithDetails.payoutNetAmount
          ? Math.abs(Number(transferWithDetails.payoutNetAmount))
          : grossAmount - (grossAmount * feePercentage) / 100

        if (newStatus === 'completed') {
          // Success notification - show net amount user received
          const mobileMoneyProvider = transferWithDetails.mobileMoneyProvider || 'mobile money'
          const notificationMessage = `${jar.currency} ${netAmount.toFixed(2)} sent to your ${mobileMoneyProvider.toUpperCase()} account (${feePercentage}% fee deducted)`
          const title = 'Payout Sent 💸'
          await fcmNotifications.sendNotification([creatorToken], notificationMessage, title, {
            type: 'payout',
            jarId: jar.id,
            transactionId: transfer.id,
          })
        } else if (newStatus === 'failed') {
          // Failure notification - show gross amount
          const amount = `${jar.currency} ${grossAmount.toFixed(2)}`
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
