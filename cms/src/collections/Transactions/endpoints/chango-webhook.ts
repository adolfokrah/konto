import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getWebhookBaseURL } from '@/utilities/getURL'

/** Local dev tunnel; production copies every Chango callback here while we learn the payload. */
const NGROK_FORWARD_URL =
  'https://ericka-maieutic-lashawn.ngrok-free.dev/api/transactions/chango-webhook'

/** References Chango hands back from `/payment`, under the names a callback might use. */
const REFERENCE_KEYS = [
  'checkoutTransactionReference',
  'transactionReference',
  'transactionId',
  'invoiceId',
  'reference',
  'jti',
]

/** Every string value under a reference-like key, at any depth. */
export function findChangoReferences(body: unknown): string[] {
  const found = new Set<string>()
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (REFERENCE_KEYS.includes(key) && typeof v === 'string' && v.trim()) found.add(v.trim())
      else walk(v)
    }
  }
  walk(body)
  return [...found]
}

/**
 * Chango webhook receiver.
 *
 * Chango's callback payload is not documented yet, so for now this only records it: the body is
 * logged and saved on the matching contribution's `webhookResponse`. The payment status is left
 * alone until we have seen real payloads and know which field means paid.
 *
 * Chango only calls production, so each callback is logged first and then copied to our ngrok
 * tunnel. The tunnel itself doesn't forward again.
 */
export const changoWebhook = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)
  const body = req.data ?? null
  console.log('[Chango] webhook body:', JSON.stringify(body, null, 2))

  const forwardUrl = NGROK_FORWARD_URL
  if (forwardUrl !== `${getWebhookBaseURL()}/api/transactions/chango-webhook`) {
    // Fire-and-forget: never hold up Chango's callback on the copy.
    fetch(forwardUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
      .then(async (res) =>
        console.log(`[Chango] forwarded to ${forwardUrl}: ${res.status} ${await res.text()}`),
      )
      .catch((err) =>
        console.warn(`[Chango] forward to ${forwardUrl} failed:`, err?.message ?? err),
      )
  }

  try {
    const references = findChangoReferences(body)
    if (references.length) {
      const { docs } = await req.payload.find({
        collection: 'transactions',
        where: {
          or: [
            { changoCheckoutReference: { in: references } },
            { changoInvoiceId: { in: references } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      const contribution = docs[0]
      if (contribution) {
        await req.payload.update({
          collection: 'transactions',
          id: contribution.id,
          data: { webhookResponse: body as any },
          overrideAccess: true,
          context: { skipCharges: true },
        })
        console.log(`[Chango] webhook matched contribution ${contribution.id}`)
      } else {
        console.warn(`[Chango] no contribution for references ${references.join(', ')}`)
      }
    } else {
      console.warn('[Chango] webhook has no reference we recognise')
    }
  } catch (err: any) {
    console.error('[Chango] failed to record webhook:', err?.message)
  }

  const response = { success: true }
  console.log('[Chango] webhook response:', JSON.stringify(response))
  return Response.json(response)
}
