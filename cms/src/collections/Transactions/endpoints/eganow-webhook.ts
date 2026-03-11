import { PayloadRequest } from 'payload'
import Eganow from '@/utilities/eganow'

const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
  SUCCESSFUL: 'completed',
  FAILED: 'failed',
  PENDING: 'pending',
  AUTHENTICATION_IN_PROGRESS: 'pending',
  EXPIRED: 'failed',
  CANCELLED: 'failed',
}

async function verifyCollectionWithEganow(
  transactionId: string,
  webhookStatus: string,
): Promise<'completed' | 'failed' | 'pending'> {
  try {
    const eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
    })

    const statusResponse = await eganow.checkTransactionStatus({
      transactionId,
      languageId: 'en',
    })

    console.log(`Eganow API verification for ${transactionId}:`, JSON.stringify(statusResponse))

    if (!statusResponse.isSuccess) {
      console.warn(
        `Eganow API did not recognise transaction ${transactionId}, falling back to webhook status`,
      )
      return statusMap[webhookStatus.toUpperCase()] ?? 'failed'
    }

    const apiStatus = statusResponse.transStatus || statusResponse.transactionstatus || ''
    const mapped = statusMap[apiStatus.toUpperCase()]

    if (!mapped || mapped === 'pending') {
      // API still shows pending — trust the webhook if it says completed/failed
      console.warn(`API status "${apiStatus}" is pending; using webhook status "${webhookStatus}"`)
      return statusMap[webhookStatus.toUpperCase()] ?? 'failed'
    }

    return mapped
  } catch (err: any) {
    console.error(
      `Eganow API verification failed for ${transactionId}: ${err.message}. Falling back to webhook status.`,
    )
    return statusMap[webhookStatus.toUpperCase()] ?? 'failed'
  }
}

/**
 * Normalizes Eganow webhook payload to handle both camelCase and PascalCase field names.
 * The Eganow API responses use camelCase but the webhook callback format is undocumented.
 */
function normalizeWebhookPayload(data: Record<string, any>) {
  return {
    transactionId: data['TransactionId'] || data['transactionId'] || '',
    eganowReferenceNo:
      data['EganowReferenceNo'] ||
      data['eganowReferenceNo'] ||
      data['EganowTransRefNo'] ||
      data['eganowTransRefNo'] ||
      '',
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
      overrideAccess: true,
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

    // Verify with Eganow API before trusting webhook status
    const newStatus = await verifyCollectionWithEganow(transactionId, transactionStatus)

    console.log(`Updating contribution ${transactionId} to status: ${newStatus}`)

    // Update contribution status
    // Do NOT update transactionReference - it should remain consistent for mobile app verification
    await req.payload.update({
      collection: 'transactions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        webhookResponse: webhookData,
      },
      overrideAccess: true,
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
