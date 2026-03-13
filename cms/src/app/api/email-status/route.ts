import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getResend } from '@/utilities/initalise'

const STATUS_MAP: Record<string, string> = {
  'email.sent': 'sending',
  'email.delivered': 'sent',
  'email.bounced': 'failed',
  'email.complained': 'failed',
  'email.failed': 'failed',
  'email.suppressed': 'failed',
}

const sanitize = (s: unknown) =>
  typeof s === 'string'
    ? s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 200_000)
    : null

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
      event = await (getResend().webhooks as any).verify({ payload: body, headers, webhookSecret })
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const newStatus = STATUS_MAP[event.type]
    if (!newStatus) {
      // Untracked event (opened, clicked, delivery_delayed, etc.) — nothing to update
      return NextResponse.json({ received: true })
    }

    const resendEmailId: string | undefined = event.data?.email_id ?? event.data?.id
    if (!resendEmailId) {
      return NextResponse.json({ received: true })
    }

    const payload = await getPayload({ config: configPromise })

    // Find existing record
    const result = await payload.find({
      collection: 'emails',
      where: { resendEmailId: { equals: resendEmailId } },
      limit: 1,
      overrideAccess: true,
    })

    const rawFrom = process.env.RESEND_FROM_EMAIL || 'support@hogapay.com'
    const SUPPORT_ADDRESS = (
      rawFrom.match(/<([^>]+)>$/) ? rawFrom.match(/<([^>]+)>$/)![1] : rawFrom
    ).toLowerCase()
    const bareEmail = (e: string) => e.replace(/^.*<(.+)>$/, '$1').trim()

    if (result.docs.length === 0) {
      // No record yet — fetch full email from Resend and create it so it appears in Sent
      try {
        const { data: sent } = await getResend().emails.get(resendEmailId)
        // Only create a record for emails sent from the support address
        if (
          sent &&
          bareEmail(sent.from ?? '')
            .toLowerCase()
            .includes(SUPPORT_ADDRESS)
        ) {
          const toList: string[] = Array.isArray(sent.to)
            ? sent.to
            : sent.to
              ? [sent.to as string]
              : []
          const bareEmail = (e: string) => e.replace(/^.*<(.+)>$/, '$1').trim()

          let linkedUser: string | null = null
          try {
            const firstRecipient = bareEmail(toList[0] ?? '')
            if (firstRecipient) {
              const userResult = await payload.find({
                collection: 'users',
                where: { email: { equals: firstRecipient } },
                limit: 1,
                overrideAccess: true,
              })
              if (userResult.docs.length > 0) linkedUser = userResult.docs[0].id as string
            }
          } catch {}

          await payload.create({
            collection: 'emails',
            data: {
              direction: 'outbound',
              from: sent.from ?? '',
              to: toList.map((e) => ({ email: bareEmail(e) })),
              subject: sent.subject ?? '(No subject)',
              bodyHtml: sanitize(sent.html),
              bodyText: sanitize(sent.text),
              resendEmailId,
              status: newStatus as any,
              isRead: true,
              sentAt: (sent as any).created_at ?? new Date().toISOString(),
              ...(linkedUser ? { linkedUser } : {}),
            } as any,
            overrideAccess: true,
          })
        }
      } catch (err) {
        console.error('[email-status] Failed to create missing sent email record:', err)
      }
      return NextResponse.json({ received: true })
    }

    const doc = result.docs[0]
    await payload.update({
      collection: 'emails',
      id: doc.id as string,
      data: { status: newStatus as any },
      overrideAccess: true,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[email-status] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
