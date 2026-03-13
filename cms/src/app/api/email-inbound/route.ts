import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getResend } from '@/utilities/initalise'

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

    // Verify the webhook signature
    let event: any
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event = await (getResend().webhooks as any).verify({ payload: body, headers, webhookSecret })
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    if (event.type !== 'email.received') {
      return NextResponse.json({ received: true })
    }

    const { email_id, from, to, subject } = event.data as {
      email_id: string
      from: string
      to: string[]
      subject: string
    }

    const INBOX_ADDRESS = 'support@hogapay.com'
    const toList: string[] = Array.isArray(to) ? to : [to]
    const isForUs = toList.some((addr) => addr.toLowerCase().includes(INBOX_ADDRESS))
    if (!isForUs) {
      return NextResponse.json({ received: true })
    }

    // Fetch full email body from Resend
    let bodyHtml: string | null = null
    let bodyText: string | null = null
    try {
      const { data: fullEmail } = await (getResend().emails as any).receiving.get(email_id)
      bodyHtml = fullEmail?.html ?? null
      bodyText = fullEmail?.text ?? null
    } catch {
      // Body fetch failed — still save the email with metadata only
    }

    const payload = await getPayload({ config: configPromise })

    // Try to find a linked platform user by sender email
    let linkedUser: string | null = null
    try {
      const userResult = await payload.find({
        collection: 'users',
        where: { email: { equals: from } },
        limit: 1,
        overrideAccess: true,
      })
      if (userResult.docs.length > 0) {
        linkedUser = userResult.docs[0].id as string
      }
    } catch {}

    await payload.create({
      collection: 'emails',
      data: {
        direction: 'inbound',
        from,
        to: toList.map((e) => ({ email: e })),
        subject: subject ?? '(No subject)',
        bodyHtml,
        bodyText,
        resendEmailId: email_id,
        status: 'received',
        isRead: false,
        ...(linkedUser ? { linkedUser } : {}),
        sentAt: new Date().toISOString(),
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[email-inbound] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
