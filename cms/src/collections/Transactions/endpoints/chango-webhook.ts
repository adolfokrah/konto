import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

/**
 * Chango webhook receiver. Logs the request body and acknowledges.
 */
export const changoWebhook = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)
  console.log('[Chango] webhook body:', JSON.stringify(req.data ?? null, null, 2))
  return Response.json({ success: true })
}
