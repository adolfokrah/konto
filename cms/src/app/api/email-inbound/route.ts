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

    let event: any
    try {
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

    // Fetch full email — body + headers (for In-Reply-To threading)
    let bodyHtml: string | null = null
    let bodyText: string | null = null
    let incomingMessageId: string | null = null
    let inReplyTo: string | null = null

    try {
      const fullEmail = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      }).then((r) => r.json())

      bodyHtml = fullEmail.html ?? null
      bodyText = fullEmail.text ?? null
      incomingMessageId = fullEmail.message_id ?? null

      // Extract In-Reply-To from headers array or object
      const emailHeaders = fullEmail.headers
      if (Array.isArray(emailHeaders)) {
        const h = emailHeaders.find(
          (h: any) =>
            h.name?.toLowerCase() === 'in-reply-to' || h.key?.toLowerCase() === 'in-reply-to',
        )
        inReplyTo = h?.value ?? null
      } else if (emailHeaders && typeof emailHeaders === 'object') {
        inReplyTo = emailHeaders['In-Reply-To'] ?? emailHeaders['in-reply-to'] ?? null
      }
    } catch {
      // proceed without body/headers
    }

    const payload = await getPayload({ config: configPromise })

    // Resolve thread: find the email this is replying to
    let threadId: string | null = null

    // 1. Try In-Reply-To header → match by stored messageId
    if (inReplyTo && !threadId) {
      try {
        const parentResult = await payload.find({
          collection: 'emails',
          where: { messageId: { equals: inReplyTo.replace(/[<>]/g, '').trim() } },
          limit: 1,
          overrideAccess: true,
        })
        if (parentResult.docs.length > 0) {
          const parent = parentResult.docs[0]
          threadId = (parent.threadId as string) || (parent.id as string)
        }
      } catch {}
    }

    // 2. Fallback: match by base subject + this sender was previously emailed by us (outbound to them)
    if (!threadId) {
      try {
        const baseSubject = (subject ?? '').replace(/^(re|fwd|fw):\s*/gi, '').trim()
        if (baseSubject) {
          const senderEmail = from.replace(/^.*<(.+)>$/, '$1').trim()
          const subjectVariants = [baseSubject, `Re: ${baseSubject}`]
          // Find an outbound email we sent to this person with same base subject
          const matchResult = await payload.find({
            collection: 'emails',
            where: {
              and: [
                { direction: { equals: 'outbound' } },
                { or: subjectVariants.map((s) => ({ subject: { equals: s } })) },
              ],
            },
            limit: 10,
            sort: '-createdAt',
            overrideAccess: true,
          })
          const match = matchResult.docs.find((doc: any) =>
            (doc.to ?? []).some((t: any) => t.email?.toLowerCase() === senderEmail.toLowerCase()),
          )
          if (match) {
            threadId = (match.threadId as string) || (match.id as string)
          }
        }
      } catch {}
    }

    // Try to link platform user by sender email
    let linkedUser: string | null = null
    try {
      const userResult = await payload.find({
        collection: 'users',
        where: { email: { equals: from } },
        limit: 1,
        overrideAccess: true,
      })
      if (userResult.docs.length > 0) linkedUser = userResult.docs[0].id as string
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
        messageId: incomingMessageId,
        status: 'received',
        isRead: false,
        sentAt: new Date().toISOString(),
        ...(threadId ? { threadId } : {}),
        ...(linkedUser ? { linkedUser } : {}),
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[email-inbound] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
