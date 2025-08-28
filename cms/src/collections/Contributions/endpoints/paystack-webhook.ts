import crypto from 'crypto'

import { PayloadRequest } from 'payload'

import { verifyPayment } from './verify-payment'

export const paystackWebhook = async (req: PayloadRequest) => {
  if (!req.arrayBuffer) {
    return Response.json({ error: 'Bad Request' }, { status: 400 })
  }
  const raw = Buffer.from(await req.arrayBuffer())

  // 2) Verify signature
  const signature = req.headers.get('x-paystack-signature') || ''
  const secret = process.env.PAYSTACK_SECRET! // use TEST secret in test mode
  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  if (hash !== signature) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = JSON.parse(raw.toString('utf8'))

  const reference: string | undefined = event?.data?.reference

  if (reference && (event.event === 'charge.success' || event.event === 'charge.failed')) {
    // kick off verification (don’t block the webhook)
    verifyPayment({ ...req, data: { reference } })
  }

  return new Response(null, { status: 200 })
}
