import type { Endpoint } from 'payload'
import { getResend } from '@/utilities/initalise'
import { runRethread } from './rethread-logic'

export const syncEndpoint: Endpoint = {
  path: '/sync',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = getResend()
    let imported = 0
    let skipped = 0
    let cursor: string | undefined
    let hasMore = true

    try {
      while (hasMore) {
        const { data, error } = await resend.emails.receiving.list({
          limit: 100,
          ...(cursor ? { after: cursor } : {}),
        })

        if (error) {
          return Response.json({ error: error.message ?? 'Resend API error' }, { status: 500 })
        }

        const emails = data?.data ?? []
        hasMore = data?.has_more ?? false

        if (emails.length === 0) break

        for (const email of emails) {
          cursor = email.id

          const existing = await req.payload.find({
            collection: 'emails',
            where: { resendEmailId: { equals: email.id } },
            limit: 1,
            overrideAccess: true,
          })
          if (existing.docs.length > 0) {
            skipped++
            continue
          }

          // Fetch full body + headers for threading
          let bodyHtml: string | null = null
          let bodyText: string | null = null
          let incomingMessageId: string | null = null
          let inReplyTo: string | null = null
          try {
            const { data: full } = await resend.emails.receiving.get(email.id)
            bodyHtml = full?.html ?? null
            bodyText = full?.text ?? null
            incomingMessageId = (full as any)?.message_id ?? null
            const emailHeaders = (full as any)?.headers
            if (Array.isArray(emailHeaders)) {
              const h = emailHeaders.find(
                (h: any) =>
                  h.name?.toLowerCase() === 'in-reply-to' || h.key?.toLowerCase() === 'in-reply-to',
              )
              inReplyTo = h?.value ?? null
            } else if (emailHeaders && typeof emailHeaders === 'object') {
              inReplyTo = emailHeaders['In-Reply-To'] ?? emailHeaders['in-reply-to'] ?? null
            }
          } catch {}

          // Resolve thread via In-Reply-To
          let threadId: string | null = null
          if (inReplyTo) {
            try {
              const parentResult = await req.payload.find({
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

          const toList: string[] = Array.isArray(email.to) ? email.to : [email.to]

          let linkedUser: string | null = null
          try {
            const userResult = await req.payload.find({
              collection: 'users',
              where: { email: { equals: email.from } },
              limit: 1,
              overrideAccess: true,
            })
            if (userResult.docs.length > 0) linkedUser = userResult.docs[0].id as string
          } catch {}

          await req.payload.create({
            collection: 'emails',
            data: {
              direction: 'inbound',
              from: email.from,
              to: toList.map((e) => ({ email: e })),
              subject: email.subject ?? '(No subject)',
              bodyHtml,
              bodyText,
              resendEmailId: email.id,
              messageId: incomingMessageId,
              status: 'received',
              isRead: false,
              sentAt: email.created_at,
              ...(threadId ? { threadId } : {}),
              ...(linkedUser ? { linkedUser } : {}),
            } as any,
            overrideAccess: true,
          })

          imported++
        }
      }

      if (imported > 0) {
        await runRethread(req.payload)
      }

      return Response.json({ imported, skipped })
    } catch (err) {
      console.error('[emails/sync] Error:', err)
      return Response.json({ error: String(err) }, { status: 500 })
    }
  },
}
