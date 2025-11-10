import crypto from 'crypto'

import { PayloadRequest } from 'payload'

import { verifyPayment } from './verify-payment'
import { verifyTransfer } from './verify-transfer'

export const paystackWebhook = async (req: PayloadRequest) => {
  if (!req.arrayBuffer) {
    return Response.json({ error: 'Bad Request' }, { status: 400 })
  }
  const raw = Buffer.from(await req.arrayBuffer())

  // 2) Verify signature
  const signature = req.headers.get('x-paystack-signature') || ''
  const secret = process.env.PAYSTACK_SECRET! // use TEST secret in test mode
  const hash = crypto.createHmac('sha512', secret).update(new Uint8Array(raw)).digest('hex')
  if (hash !== signature) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = JSON.parse(raw.toString('utf8'))

  const reference: string | undefined = event?.data?.reference

  if (reference && (event.event === 'charge.success' || event.event === 'charge.failed')) {
    // Check if contribution is already in a final state before processing
    const existingContribution = await req.payload.find({
      collection: 'contributions',
      where: {
        transactionReference: { equals: reference },
      },
      limit: 1,
    })

    if (existingContribution.docs.length > 0) {
      const contribution = existingContribution.docs[0]
      // Skip if already completed or failed (final states)
      if (contribution.paymentStatus === 'completed' || contribution.paymentStatus === 'failed') {
        console.log(
          `Webhook: Contribution ${contribution.id} already in final state (${contribution.paymentStatus}), skipping update`,
        )
        return new Response(null, { status: 200 })
      }
    }

    verifyPayment({ ...req, data: { reference } })
  } else if (reference && event.event === 'transfer.success') {
    verifyTransfer({ ...req, data: { reference } })
  }

  return new Response(null, { status: 200 })
}
