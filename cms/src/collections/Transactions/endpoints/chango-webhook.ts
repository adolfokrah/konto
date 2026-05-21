import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

/**
 * Chango webhook receiver. Logs the request and acknowledges.
 */
export const changoWebhook = async (req: PayloadRequest) => {
  await addDataAndFileToRequest(req)

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  console.log(
    '[Chango] webhook received:',
    JSON.stringify(
      {
        method: req.method,
        url: req.url,
        headers,
        body: req.data ?? null,
      },
      null,
      2,
    ),
  )

  return Response.json({ success: true })
}
