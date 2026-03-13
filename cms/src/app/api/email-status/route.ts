import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getResend } from '@/utilities/initalise'

const STATUS_MAP: Record<string, string> = {
  'email.delivered': 'sent',
  'email.bounced': 'failed',
  'email.complained': 'failed',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headers = {
      id: req.headers.get('svix-id') ?? '',
      timestamp: req.headers.get('svix-timestamp') ?? '',
      signature: req.headers.get('svix-signature') ?? '',
    }

    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event = await (getResend().webhooks as any).verify({ payload: body, headers, webhookSecret })
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const newStatus = STATUS_MAP[event.type]
    if (!newStatus) {
      return NextResponse.json({ received: true })
    }

    const resendEmailId: string | undefined = event.data?.email_id ?? event.data?.id
    if (!resendEmailId) {
      return NextResponse.json({ received: true })
    }

    const payload = await getPayload({ config: configPromise })

    // Find the email record by its Resend email ID
    const result = await payload.find({
      collection: 'emails',
      where: { resendEmailId: { equals: resendEmailId } },
      limit: 1,
      overrideAccess: true,
    })

    if (result.docs.length === 0) {
      return NextResponse.json({ received: true })
    }

    const doc = result.docs[0]

    await payload.update({
      collection: 'emails',
      id: doc.id as string,
      data: { status: newStatus as any },
      overrideAccess: true,
    })

    if (event.type === 'email.complained') {
      console.warn(
        `[email-status] Spam complaint from ${event.data?.from} for email ${resendEmailId}`,
      )
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[email-status] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
