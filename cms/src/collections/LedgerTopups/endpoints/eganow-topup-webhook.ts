import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

function normalizeWebhookPayload(data: Record<string, any>) {
  return {
    transactionId: data['TransactionId'] || data['transactionId'] || data['transactionid'] || '',
    transactionStatus:
      data['TransactionStatus'] || data['transactionStatus'] || data['transactionstatus'] || '',
    eganowReferenceNo:
      data['EganowReferenceNo'] ||
      data['eganowReferenceNo'] ||
      data['EganowTransRefNo'] ||
      data['eganowTransRefNo'] ||
      '',
    message: data['Message'] || data['message'] || '',
  }
}

export const eganowTopupWebhook = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const rawData = req.data || {}

    console.log('[topup-webhook] Received:', JSON.stringify(rawData))

    const { transactionId, transactionStatus, eganowReferenceNo } = normalizeWebhookPayload(rawData)

    if (!transactionId) {
      return Response.json({ success: false, message: 'Missing transactionId' }, { status: 400 })
    }

    // Extract the topup ID from transactionId format: topup-{id}
    const topupId = transactionId.replace(/^topup-/, '')

    const topup = await req.payload.find({
      collection: 'ledger-topups',
      where: { id: { equals: topupId } },
      limit: 1,
      overrideAccess: true,
    })

    if (!topup.docs.length) {
      console.error(`[topup-webhook] Topup not found: ${topupId}`)
      return Response.json({ success: false, message: 'Topup not found' }, { status: 404 })
    }

    const status = transactionStatus.toLowerCase()
    let newStatus: 'completed' | 'failed' | 'pending' = 'pending'
    if (status === 'successful' || status === 'success') {
      newStatus = 'completed'
    } else if (status === 'failed' || status === 'expired' || status === 'cancelled') {
      newStatus = 'failed'
    }

    await req.payload.update({
      collection: 'ledger-topups',
      id: topupId,
      data: {
        status: newStatus,
        ...(eganowReferenceNo && { transactionReference: eganowReferenceNo }),
      },
      overrideAccess: true,
    })

    console.log(`[topup-webhook] Updated topup ${topupId} to ${newStatus}`)

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('[topup-webhook] Error:', error.message)
    return Response.json({ success: true }) // Return 200 to avoid retries
  }
}
