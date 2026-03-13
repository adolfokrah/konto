import type { Endpoint } from 'payload'
import { getResend } from '@/utilities/initalise'

export const sendEndpoint: Endpoint = {
  path: '/send',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json!()
    const { to, cc, subject, bodyHtml, bodyText, replyToEmailId } = body

    if (!to || !subject || (!bodyHtml && !bodyText)) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
    }

    const toAddresses: string[] = Array.isArray(to) ? to : [to]
    const ccAddresses: string[] = Array.isArray(cc) ? cc : cc ? [cc] : []
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Hogapay <noreply@hogapay.com>'

    const { data, error } = await getResend().emails.send({
      from: fromAddress,
      to: toAddresses,
      ...(ccAddresses.length ? { cc: ccAddresses } : {}),
      subject,
      ...(bodyHtml ? { html: bodyHtml } : {}),
      ...(bodyText ? { text: bodyText } : {}),
    } as any)

    if (error) {
      return Response.json({ error: error.message ?? 'Send failed' }, { status: 500 })
    }

    // Fetch the sent email to get its RFC Message-ID for threading
    let messageId: string | null = null
    if (data?.id) {
      try {
        const sent = await getResend().emails.get(data.id)
        messageId = (sent.data as any)?.message_id ?? null
      } catch {}
    }

    const extractBareEmail = (addr: string) => {
      const m = addr.match(/<([^>]+)>$/)
      return m ? m[1] : addr
    }

    const doc = await req.payload.create({
      collection: 'emails',
      data: {
        direction: 'outbound',
        from: fromAddress,
        to: toAddresses.map((e) => ({ email: extractBareEmail(e) })),
        subject,
        bodyHtml: bodyHtml ?? null,
        bodyText: bodyText ?? null,
        resendEmailId: data?.id ?? null,
        messageId,
        status: 'sent',
        isRead: true,
        sentAt: new Date().toISOString(),
        ...(replyToEmailId ? { threadId: replyToEmailId } : {}),
      } as any,
      overrideAccess: true,
    })

    return Response.json({ success: true, id: doc.id })
  },
}
