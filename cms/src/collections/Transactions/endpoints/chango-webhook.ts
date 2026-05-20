import type { PayloadRequest } from 'payload'

/**
 * Chango webhook receiver. No-op for now — just acknowledges receipt.
 */
export const changoWebhook = async (_req: PayloadRequest) => {
  return Response.json({ success: true })
}
