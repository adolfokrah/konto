import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getResend } from '@/utilities/initalise'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Authenticate via session cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, bodyHtml, bodyText, replyToEmailId } = await req.json()

    if (!to || !subject || (!bodyHtml && !bodyText)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 },
      )
    }

    const toAddresses: string[] = Array.isArray(to) ? to : [to]

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Hogapay <noreply@hogapay.com>'

    // Send via Resend
    const sendResult = await (getResend().emails as any).send({
      from: fromAddress,
      to: toAddresses,
      subject,
      ...(bodyHtml ? { html: bodyHtml } : {}),
      ...(bodyText ? { text: bodyText } : {}),
    })

    const resendEmailId = (sendResult.data as any)?.id ?? null
    const failed = !!sendResult.error

    // Persist to emails collection
    const doc = await payload.create({
      collection: 'emails',
      data: {
        direction: 'outbound',
        from: fromAddress,
        to: toAddresses.map((e) => ({ email: e })),
        subject,
        bodyHtml: bodyHtml ?? null,
        bodyText: bodyText ?? null,
        resendEmailId,
        status: failed ? 'failed' : 'sent',
        isRead: true,
        sentAt: new Date().toISOString(),
        ...(replyToEmailId ? { threadId: replyToEmailId } : {}),
      } as any,
      overrideAccess: true,
    })

    if (failed) {
      return NextResponse.json(
        { error: sendResult.error?.message ?? 'Send failed' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, id: doc.id })
  } catch (err) {
    console.error('[emails/send] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
