import { PayloadRequest } from 'payload'
import { FCMPushNotifications } from '@/utilities/fcmPushNotifications'
import Eganow from '@/utilities/eganow'

/**
 * Normalizes Eganow webhook payload to handle both camelCase and PascalCase field names.
 * The Eganow API responses use camelCase but the webhook callback format is undocumented.
 */
function normalizeWebhookPayload(data: Record<string, any>) {
  const status = data['Status'] !== undefined ? data['Status'] : data['status']
  const transactionStatus =
    data['TransactionStatus'] ||
    data['transactionStatus'] ||
    (status === false ? 'failed' : status === true ? 'success' : '')

  return {
    transactionId: data['TransactionId'] || data['transactionId'] || '',
    eganowReferenceNo:
      data['EganowReferenceNo'] ||
      data['eganowReferenceNo'] ||
      data['EganowTransRefNo'] ||
      data['eganowTransRefNo'] ||
      '',
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

    // Determine if this is a refund or payout based on transactionId format
    const isRefund = transactionId.startsWith('refund-')

    if (isRefund) {
      return handleRefundWebhook(req, transactionId, eganowReferenceNo, transactionStatus, message)
    }

    return handlePayoutWebhook(req, transactionId, eganowReferenceNo, transactionStatus, message)
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

async function handleRefundWebhook(
  req: PayloadRequest,
  transactionId: string,
  eganowReferenceNo: string,
  transactionStatus: string,
  message: string,
) {
  // Look up refund by Eganow reference number
  let refundResult = await req.payload.find({
    collection: 'refunds' as any,
    where: {
      transactionReference: { equals: eganowReferenceNo },
    },
    limit: 1,
    overrideAccess: true,
  })

  // Fallback: search by refund ID from transactionId format "refund-{refundId}"
  if (refundResult.docs.length === 0 && transactionId) {
    const match = transactionId.match(/^refund-([a-f0-9]+)$/)
    if (match) {
      const refundId = match[1]
      console.log(`Searching for refund by ID: ${refundId}`)
      refundResult = await req.payload.find({
        collection: 'refunds' as any,
        where: { id: { equals: refundId } },
        limit: 1,
        overrideAccess: true,
      })
    }
  }

  if (refundResult.docs.length === 0) {
    console.error(`Refund not found for transactionId: ${transactionId}, ref: ${eganowReferenceNo}`)
    return Response.json({ error: 'Refund not found' }, { status: 404 })
  }

  const refund = refundResult.docs[0] as any

  // Only process if refund is in-progress
  if (refund.status !== 'in-progress') {
    console.log(`Refund ${refund.id} status is ${refund.status}, not in-progress. Skipping.`)
    return new Response(null, { status: 200 })
  }

  // Verify with Eganow API
  const newStatus = await verifyWithEganow(transactionId, eganowReferenceNo, transactionStatus)

  const refundStatusMap: Record<string, string> = {
    completed: 'completed',
    failed: 'failed',
    pending: 'in-progress',
  }
  const mappedStatus = refundStatusMap[newStatus] || 'failed'

  console.log(`Updating refund ${refund.id} to status: ${mappedStatus}`)

  // Update refund status (syncLinkedTransaction hook handles marking original tx as failed)
  await req.payload.update({
    collection: 'refunds' as any,
    id: refund.id,
    data: { status: mappedStatus },
    overrideAccess: true,
  })

  // Send FCM notification
  await sendRefundNotification(req, refund, mappedStatus, message)

  return new Response(null, { status: 200 })
}

async function handlePayoutWebhook(
  req: PayloadRequest,
  transactionId: string,
  eganowReferenceNo: string,
  transactionStatus: string,
  message: string,
) {
  // Find the payout record by Eganow reference number
  let transferResult = await req.payload.find({
    collection: 'transactions',
    where: {
      transactionReference: { equals: eganowReferenceNo },
      type: { equals: 'payout' },
    },
    limit: 1,
    overrideAccess: true,
  })

  // Fallback: search by transaction ID extracted from "payout-{transactionId}"
  if (transferResult.docs.length === 0 && transactionId) {
    const match = transactionId.match(/^payout-([a-f0-9]+)$/)
    if (match) {
      const extractedId = match[1]
      console.log(`Searching for payout by transaction ID: ${extractedId}`)
      transferResult = await req.payload.find({
        collection: 'transactions',
        where: {
          id: { equals: extractedId },
          type: { equals: 'payout' },
        },
        limit: 1,
        overrideAccess: true,
      })
    }
  }

  if (transferResult.docs.length === 0) {
    console.error(
      `Transfer not found for transactionId: ${transactionId}, ref: ${eganowReferenceNo}`,
    )
    return Response.json({ error: 'Transfer not found' }, { status: 404 })
  }

  const transfer = transferResult.docs[0]

  // Only process if transfer status is pending
  if (transfer.paymentStatus !== 'pending') {
    console.log(
      `Transfer ${transfer.id} status is ${transfer.paymentStatus}, not pending. Skipping.`,
    )
    return new Response(null, { status: 200 })
  }

  // Verify with Eganow API
  const newStatus = await verifyWithEganow(transactionId, eganowReferenceNo, transactionStatus)

  console.log(
    `Updating transfer ${transfer.id} to status: ${newStatus}${message ? ` (${message})` : ''}`,
  )

  // Update transfer status
  await req.payload.update({
    collection: 'transactions',
    id: transfer.id,
    data: { paymentStatus: newStatus },
    overrideAccess: true,
  })

  // Send FCM notification for payout
  await sendPayoutNotification(req, transfer, newStatus, message)

  console.log(`Successfully updated transfer ${transfer.id} to ${newStatus}`)
  return new Response(null, { status: 200 })
}

async function verifyWithEganow(
  transactionId: string,
  eganowReferenceNo: string,
  webhookStatus: string,
): Promise<'completed' | 'failed' | 'pending'> {
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
  const retryDelayMs = 5000
  let verifiedStatus = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Retry ${attempt}/${maxRetries} — waiting ${retryDelayMs / 1000}s...`)
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
      }

      const statusResponse = await eganow.checkTransactionStatus({
        transactionId,
        languageId: 'en',
      })

      console.log(`Attempt ${attempt} Eganow status:`, JSON.stringify(statusResponse, null, 2))

      if (!statusResponse.isSuccess) {
        console.error(
          `Eganow does not recognize transaction ${transactionId}: ${statusResponse.message}`,
        )
        return 'failed'
      }

      // Verify reference number matches
      const apiRef = statusResponse.referenceNo || ''
      if (apiRef && eganowReferenceNo && apiRef !== eganowReferenceNo) {
        console.error(`Reference mismatch! Webhook: ${eganowReferenceNo}, API: ${apiRef}`)
        return 'failed'
      }

      verifiedStatus = statusResponse.transStatus || statusResponse.transactionstatus || ''

      if (!nonFinalStatuses.includes(verifiedStatus.toUpperCase())) {
        break
      }

      if (attempt === maxRetries) {
        console.warn(
          `API still says ${verifiedStatus} after ${maxRetries} attempts. Using webhook status.`,
        )
        verifiedStatus = webhookStatus
      }
    } catch (error: any) {
      console.error(`Attempt ${attempt} — Failed to verify: ${error.message}`)
      if (attempt === maxRetries) {
        return 'failed'
      }
    }
  }

  return statusMap[verifiedStatus?.toUpperCase() || 'FAILED'] || 'failed'
}

async function sendRefundNotification(
  req: PayloadRequest,
  refund: any,
  status: string,
  message: string,
) {
  try {
    const jarId = typeof refund.jar === 'string' ? refund.jar : refund.jar?.id
    if (!jarId) return

    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
      overrideAccess: true,
    })

    if (!jar || typeof jar.creator !== 'object' || !jar.creator) return

    const creatorToken = (jar.creator as any)?.fcmToken
    if (!creatorToken) return

    const fcm = new FCMPushNotifications()
    const amount = `${jar.currency || 'GHS'} ${Number(refund.amount).toFixed(2)}`

    if (status === 'completed') {
      await fcm.sendNotification(
        [creatorToken],
        `Refund of ${amount} for "${jar.name}" was successfully sent to the contributor.`,
        'Refund Processed',
        { type: 'refund', jarId: jar.id, refundId: refund.id },
      )
    } else if (status === 'failed') {
      await fcm.sendNotification(
        [creatorToken],
        `Refund of ${amount} for "${jar.name}" failed${message ? `: ${message}` : ''}.`,
        'Refund Failed',
        { type: 'refund-failed', jarId: jar.id, refundId: refund.id },
      )
    }
  } catch (error: any) {
    console.error('Failed to send refund notification:', error.message)
  }
}

async function sendPayoutNotification(
  req: PayloadRequest,
  transfer: any,
  newStatus: string,
  message: string,
) {
  try {
    const transferWithDetails = await req.payload.findByID({
      collection: 'transactions',
      id: transfer.id,
      depth: 2,
    })

    if (
      !transferWithDetails ||
      typeof transferWithDetails.jar !== 'object' ||
      !transferWithDetails.jar
    )
      return

    const jar = transferWithDetails.jar
    const creatorToken = typeof jar.creator === 'object' ? (jar.creator as any)?.fcmToken : null
    if (!creatorToken) return

    const fcm = new FCMPushNotifications()
    const grossAmount = Math.abs(Number(transferWithDetails.amountContributed))
    const feePercentage = transferWithDetails.payoutFeePercentage || 1
    const netAmount = transferWithDetails.payoutNetAmount
      ? Math.abs(Number(transferWithDetails.payoutNetAmount))
      : grossAmount - (grossAmount * feePercentage) / 100

    if (newStatus === 'completed') {
      const mobileMoneyProvider = transferWithDetails.mobileMoneyProvider || 'mobile money'
      await fcm.sendNotification(
        [creatorToken],
        `${jar.currency} ${netAmount.toFixed(2)} sent to your ${mobileMoneyProvider.toUpperCase()} account (${feePercentage}% fee deducted)`,
        'Payout Sent 💸',
        { type: 'payout', jarId: jar.id, transactionId: transfer.id },
      )
    } else if (newStatus === 'failed') {
      const amount = `${jar.currency} ${grossAmount.toFixed(2)}`
      await fcm.sendNotification(
        [creatorToken],
        `Your transfer of ${amount} for "${jar.name}" failed${message ? `: ${message}` : ''}. Please try again.`,
        'Transfer Failed ❌',
        { type: 'payout-failed', jarId: jar.id, transactionId: transfer.id },
      )
    }
  } catch (error: any) {
    console.error('Failed to send payout notification:', error.message)
  }
}
