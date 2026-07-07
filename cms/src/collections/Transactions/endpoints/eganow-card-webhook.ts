import { PayloadRequest } from 'payload'
import Eganow from '@/utilities/eganow'

// Card 3D Secure result → internal payment status.
// The card challenge page posts `status: "APPROVED" | "DECLINED" | ...` to the callback.
const statusMap: Record<string, 'completed' | 'failed' | 'pending'> = {
  APPROVED: 'completed',
  SUCCESSFUL: 'completed',
  SUCCESS: 'completed',
  DECLINED: 'failed',
  FAILED: 'failed',
  CANCELLED: 'failed',
  EXPIRED: 'failed',
  PENDING: 'pending',
  AUTHENTICATION_IN_PROGRESS: 'pending',
}

// The 3D Secure page performs a client-side fetch to this callback, so it needs CORS.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Normalizes the card webhook payload. Field/casing conventions are undocumented, so
 * accept both PascalCase and camelCase.
 * `TransactionId` here is the Eganow reference number (matches our `transactionReference`).
 */
function normalizeCardWebhook(data: Record<string, any>) {
  return {
    eganowReferenceNo: data['TransactionId'] || data['transactionId'] || '',
    status: data['status'] || data['Status'] || data['transactionStatus'] || '',
    processorId: data['processorId'] || data['ProcessorId'] || '',
  }
}

async function verifyCardWithEganow(
  transactionId: string,
  webhookStatus: string,
): Promise<'completed' | 'failed' | 'pending'> {
  const fallback = statusMap[webhookStatus.toUpperCase()] ?? 'failed'
  try {
    const eganow = new Eganow({
      username: process.env.EGANOW_SECRET_USERNAME!,
      password: process.env.EGANOW_SECRET_PASSWORD!,
      xAuth: process.env.EGANOW_X_AUTH_TOKEN!,
    })

    const statusResponse = await eganow.checkTransactionStatus({ transactionId, languageId: 'en' })

    if (!statusResponse.isSuccess) {
      return fallback
    }

    const apiStatus = statusResponse.transStatus || statusResponse.transactionstatus || ''
    const mapped = statusMap[apiStatus.toUpperCase()]

    // If the API is still pending/unknown, trust a terminal webhook status.
    if (!mapped || mapped === 'pending') {
      return fallback
    }

    return mapped
  } catch {
    return fallback
  }
}

export const eganowCardWebhook = async (req: PayloadRequest) => {
  // CORS preflight for the browser-side fetch from the 3DS challenge page.
  if (req.method?.toUpperCase() === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    if (!req.arrayBuffer) {
      return Response.json({ error: 'Bad Request' }, { status: 400, headers: CORS_HEADERS })
    }

    const raw = Buffer.from(await req.arrayBuffer())
    const webhookData = JSON.parse(raw.toString('utf8'))

    const { eganowReferenceNo, status, processorId } = normalizeCardWebhook(webhookData)

    if (!eganowReferenceNo || !status) {
      return Response.json(
        { error: 'Invalid webhook data' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    // Card `TransactionId` is the Eganow reference we stored in `transactionReference`.
    const contributionResult = await req.payload.find({
      collection: 'transactions',
      where: { transactionReference: { equals: eganowReferenceNo } },
      limit: 1,
      overrideAccess: true,
    })

    if (contributionResult.docs.length === 0) {
      return Response.json(
        { error: 'Contribution not found' },
        { status: 404, headers: CORS_HEADERS },
      )
    }

    const contribution = contributionResult.docs[0]

    // Only process while pending, to avoid clobbering a finalized status.
    if (contribution.paymentStatus !== 'pending') {
      return new Response(null, { status: 200, headers: CORS_HEADERS })
    }

    // Verify against the Eganow status API before trusting the webhook.
    // Card status must be queried by the Eganow reference number, not our contribution id.
    const newStatus = await verifyCardWithEganow(eganowReferenceNo, status)

    await req.payload.update({
      collection: 'transactions',
      id: contribution.id,
      data: {
        paymentStatus: newStatus,
        webhookResponse: webhookData,
        ...(processorId && { eganowPayPartnerTransactionId: processorId }),
      },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    return new Response(null, { status: 200, headers: CORS_HEADERS })
  } catch (error: any) {
    console.error('Eganow card webhook error:', error)
    return Response.json(
      { error: 'Internal server error', message: error.message },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
