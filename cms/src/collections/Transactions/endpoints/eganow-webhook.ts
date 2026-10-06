import { PayloadRequest } from 'payload'
import Eganow from '@/utilities/eganow'

const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
  SUCCESSFUL: 'completed',
  SUCCESS: 'completed',
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
 *
 * `transactionId` is our own contribution id. Direct collections echo it as `TransactionId`.
 * Hosted checkout echoes it as `merchantReference` and uses `transactionId` for Eganow's own
 * id, so `merchantReference` wins whenever it is present:
 *   { transactionId: "<eganow id>", merchantReference: "<contribution id>", status: "success" }
 */
export function normalizeWebhookPayload(data: Record<string, any>) {
  const merchantReference = data['MerchantReference'] || data['merchantReference'] || ''
  const callbackTransactionId = data['TransactionId'] || data['transactionId'] || ''

  return {
    transactionId: merchantReference || callbackTransactionId,
    eganowReferenceNo:
      data['EganowReferenceNo'] ||
      data['eganowReferenceNo'] ||
      data['EganowTransRefNo'] ||
      data['eganowTransRefNo'] ||
      (merchantReference ? callbackTransactionId : '') ||
      '',
    transactionStatus:
      data['TransactionStatus'] ||
      data['transactionStatus'] ||
      data['Status'] ||
      data['status'] ||
      '',
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

    const { transactionId, transactionStatus, payPartnerTransactionId, eganowReferenceNo } =
      normalizeWebhookPayload(webhookData)

    // Validate required fields
    if (!transactionId || !transactionStatus) {
      console.error('Invalid webhook data: missing required fields')
      return Response.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    // Hosted checkout sends two callbacks: its own (with our id as `merchantReference`) and
    // then the underlying collection's, whose `TransactionId` is Eganow's hosted checkout id.
    // That id was saved on the contribution when the checkout was created, so fall back to it.
    const isHostedCallback = Boolean(
      webhookData['merchantReference'] || webhookData['MerchantReference'],
    )
    let contributionResult = await req.payload.find({
      collection: 'transactions',
      where: { id: { equals: transactionId } },
      limit: 1,
      overrideAccess: true,
    })
    if (contributionResult.docs.length === 0) {
      contributionResult = await req.payload.find({
        collection: 'transactions',
        where: { eganowPayPartnerTransactionId: { equals: transactionId } },
        limit: 1,
        overrideAccess: true,
      })
    }

    if (contributionResult.docs.length === 0) {
      console.error(`Contribution not found for transactionId: ${transactionId}`)
      return Response.json({ error: 'Contribution not found' }, { status: 404 })
    }

    const contribution = contributionResult.docs[0]
    console.log(
      `[webhook] fetched contribution chargesBreakdown:`,
      JSON.stringify(contribution.chargesBreakdown),
    )

    // Pending contributions are always processed. A failed one may still be completed: hosted
    // checkout can report a failed attempt and then a successful one for the same payment.
    const canRecover =
      contribution.paymentStatus === 'failed' &&
      statusMap[transactionStatus.toUpperCase()] === 'completed'
    if (contribution.paymentStatus !== 'pending' && !canRecover) {
      console.log(
        `Contribution ${contribution.id} status is ${contribution.paymentStatus}, not pending. Skipping update.`,
      )
      return new Response(null, { status: 200 })
    }

    // Verify with Eganow API before trusting webhook status
    let newStatus = await verifyCollectionWithEganow(transactionId, transactionStatus)

    // The payer can retry on Eganow's page, so a failed hosted attempt is not final: keep the
    // contribution pending and let a later success (or the pending-transactions job) settle it.
    if (isHostedCallback && newStatus === 'failed') {
      console.log(
        `Hosted checkout attempt failed for ${contribution.id} (${webhookData['message'] || 'no message'}); keeping it pending.`,
      )
      newStatus = 'pending'
    }

    console.log(`Updating contribution ${contribution.id} to status: ${newStatus}`)

    // Update contribution status
    // Do NOT update transactionReference - it should remain consistent for mobile app verification
    await req.payload.update({
      collection: 'transactions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        webhookResponse: webhookData,
        // Keep an id saved earlier: for hosted checkout it is the id later callbacks use.
        ...(!contribution.eganowPayPartnerTransactionId &&
          (payPartnerTransactionId || eganowReferenceNo) && {
            eganowPayPartnerTransactionId: payPartnerTransactionId || eganowReferenceNo,
          }),
      },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    console.log(`Successfully updated contribution ${contribution.id} to ${newStatus}`)
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
