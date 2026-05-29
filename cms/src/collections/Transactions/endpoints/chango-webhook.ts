import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

const FORWARD_URL = 'https://hoga-staging.up.railway.app/api/transactions/chango-webhook'

/**
 * Chango webhook receiver. Logs the request body, forwards to staging,
 * and acknowledges.
 */
export const changoWebhook = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)
  const body = req.data ?? null
  console.log('[Chango] webhook body:', JSON.stringify(body, null, 2))

  // Fire-and-forget forward to staging. Don't block response on failure.
  fetch(FORWARD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
    .then((res) => {
      console.log(`[Chango] forwarded to staging: ${res.status}`)
    })
    .catch((err) => {
      console.warn('[Chango] forward to staging failed:', err?.message ?? err)
    })

  return Response.json({ success: true })
}
