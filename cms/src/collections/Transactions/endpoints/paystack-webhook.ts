import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import crypto from 'crypto'

/**
 * POST /api/transactions/paystack-webhook
 *
 * Handles all Paystack server-to-server event notifications:
 *   - charge.success / charge.failed / charge.abandoned   → contribution transactions
 *   - transfer.success / transfer.failed / transfer.reversed → payout transactions
 *   - refund.pending / refund.processed / refund.failed    → refunds collection
 *
 * Configure in: Paystack Dashboard → Settings → API Keys & Webhooks
 */
export const paystackWebhook = async (req: PayloadRequest) => {
  try {
    const signature = req.headers.get('x-paystack-signature')
    const secret = process.env.PAYSTACK_SECRET_KEY!

    // Payload v3 exposes the parsed body on req.data — re-serialize for signature verification
    // since the raw stream may have already been consumed by framework middleware.
    await addDataAndFileToRequest(req)
    const rawBody = JSON.stringify(req.data)

    console.log(
      '[paystack-webhook] received event, body length:',
      rawBody?.length,
      'signature present:',
      !!signature,
    )

    // Verify signature
    const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    if (hash !== signature) {
      console.error(
        '[paystack-webhook] signature mismatch — hash:',
        hash.slice(0, 20),
        'sig:',
        signature?.slice(0, 20),
      )
      return Response.json({ success: false, message: 'Invalid signature' }, { status: 401 })
    }

    let event: any
    try {
      event = JSON.parse(rawBody)
    } catch {
      return Response.json({ success: false, message: 'Invalid JSON' }, { status: 400 })
    }

    const { event: eventType, data } = event

    // ── Charge (collection) ──────────────────────────────────────────────────
    if (['charge.success', 'charge.failed', 'charge.abandoned'].includes(eventType)) {
      await handleChargeEvent(req, eventType, data)
      return Response.json({ success: true })
    }

    // ── Transfer (payout) ────────────────────────────────────────────────────
    if (['transfer.success', 'transfer.failed', 'transfer.reversed'].includes(eventType)) {
      await handleTransferEvent(req, eventType, data)
      return Response.json({ success: true })
    }

    // ── Refund ───────────────────────────────────────────────────────────────
    if (['refund.pending', 'refund.processed', 'refund.failed'].includes(eventType)) {
      await handleRefundEvent(req, eventType, data)
      return Response.json({ success: true })
    }

    // Acknowledge unknown events without error
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('paystackWebhook error:', error)
    // Always return 200 so Paystack does not retry indefinitely
    return Response.json({ success: false, message: error.message }, { status: 200 })
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleChargeEvent(req: PayloadRequest, eventType: string, data: any) {
  const reference = data?.reference
  if (!reference) return

  const transactions = await req.payload.find({
    collection: 'transactions',
    where: { transactionReference: { equals: reference } },
    limit: 1,
    overrideAccess: true,
  })

  const transaction = transactions.docs[0] as any
  if (!transaction) return

  // Skip if already in a terminal state
  if (transaction.paymentStatus === 'completed' || transaction.paymentStatus === 'failed') return

  const newStatus = eventType === 'charge.success' ? 'completed' : 'failed'

  const jarId = typeof transaction.jar === 'object' ? transaction.jar?.id : transaction.jar
  const collectorId =
    typeof transaction.collector === 'object' ? transaction.collector?.id : transaction.collector

  const authorization = data?.authorization ?? {}
  const customer = data?.customer ?? {}
  const channel = data?.channel as string | undefined

  // Map Paystack channel to our paymentMethod values
  const channelToMethod: Record<string, 'mobile-money' | 'card' | 'bank'> = {
    mobile_money: 'mobile-money',
    card: 'card',
    apple_pay: 'card',
    bank: 'bank',
    bank_transfer: 'bank',
  }
  const paymentMethod = channel ? (channelToMethod[channel] ?? null) : null

  // Email is available for all payment methods
  const email = (customer.email as string) || null

  // Only extract provider for mobile money — phone number is masked in webhook, not usable
  let provider: string | null = null
  if (channel === 'mobile_money') {
    const rawBank = (authorization.bank || '').toLowerCase()
    const providerMap: Record<string, string> = {
      mtn: 'mtn',
      telecel: 'telecel',
      vodafone: 'telecel',
      airteltigo: 'airteltigo',
    }
    provider = Object.entries(providerMap).find(([key]) => rawBank.includes(key))?.[1] ?? null
  }

  await req.payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: {
      paymentStatus: newStatus,
      webhookResponse: data,
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(email && !transaction.contributorEmail ? { contributorEmail: email } : {}),
      ...(provider ? { mobileMoneyProvider: provider } : {}),
      ...(jarId ? { jar: jarId } : {}),
      ...(collectorId ? { collector: collectorId } : {}),
    },
    overrideAccess: true,
    context: { skipCharges: true },
  })
}

async function handleTransferEvent(req: PayloadRequest, eventType: string, data: any) {
  // data.reference = the value we passed to initiateTransfer:
  //   payouts:               transaction.id
  //   refunds:               refundId
  //   referral withdrawals:  withdrawalRecordId (no DB update needed from webhook)
  const reference = data?.reference
  if (!reference) return

  const newStatus = eventType === 'transfer.success' ? 'completed' : 'failed'

  // ── Try payout transaction (look up by ID) ───────────────────────────────
  try {
    const doc = (await req.payload.findByID({
      collection: 'transactions',
      id: reference,
      overrideAccess: true,
    })) as any
    if (doc && doc.type === 'payout') {
      if (doc.paymentStatus === 'completed' || doc.paymentStatus === 'failed') return
      const jarId = typeof doc.jar === 'object' ? doc.jar?.id : doc.jar
      const collectorId = typeof doc.collector === 'object' ? doc.collector?.id : doc.collector
      await req.payload.update({
        collection: 'transactions',
        id: doc.id,
        data: {
          paymentStatus: newStatus,
          webhookResponse: data,
          ...(jarId ? { jar: jarId } : {}),
          ...(collectorId ? { collector: collectorId } : {}),
        },
        overrideAccess: true,
        context: { skipCharges: true },
      })
      return
    }
  } catch {
    // Not a valid transaction ID — try refund
  }

  // ── Try refund (look up by ID) ───────────────────────────────────────────
  try {
    const refund = (await req.payload.findByID({
      collection: 'refunds',
      id: reference,
      overrideAccess: true,
    })) as any
    if (refund && refund.status === 'in-progress') {
      await req.payload.update({
        collection: 'refunds',
        id: refund.id,
        data: { status: newStatus },
        overrideAccess: true,
      })
      return
    }
  } catch {
    // Not a valid refund ID — fall through (may be referral withdrawal, no action needed)
  }
}

async function handleRefundEvent(req: PayloadRequest, eventType: string, data: any) {
  // Paystack refund events include the original transaction reference
  const originalReference = data?.transaction?.reference
  if (!originalReference) return

  // Find the original transaction
  const transactions = await req.payload.find({
    collection: 'transactions',
    where: { transactionReference: { equals: originalReference } },
    limit: 1,
    overrideAccess: true,
  })

  const transaction = transactions.docs[0] as any
  if (!transaction) return

  // Find the linked refund record
  const refunds = await req.payload.find({
    collection: 'refunds',
    where: { linkedTransaction: { equals: transaction.id } },
    limit: 1,
    overrideAccess: true,
  })

  const refund = refunds.docs[0] as any
  if (!refund) return

  const newStatus =
    eventType === 'refund.processed'
      ? 'completed'
      : eventType === 'refund.failed'
        ? 'failed'
        : 'in-progress' // refund.pending

  if (refund.status === 'completed' || refund.status === 'failed') return

  await req.payload.update({
    collection: 'refunds',
    id: refund.id,
    data: {
      status: newStatus,
      webhookResponse: data,
    },
    overrideAccess: true,
  })
}
