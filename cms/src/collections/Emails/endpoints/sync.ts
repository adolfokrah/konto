import type { Endpoint } from 'payload'
import { getResend } from '@/utilities/initalise'
import { runRethread } from './rethread-logic'

const sanitize = (s: unknown) =>
  typeof s === 'string'
    ? s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, 200_000)
    : null

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

    try {
      // ── Sync received (inbound) emails ──────────────────────────────────────
      let cursor: string | undefined
      let hasMore = true

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

          let bodyHtml: string | null = null
          let bodyText: string | null = null
          let incomingMessageId: string | null = null
          let inReplyTo: string | null = null
          let attachments: { filename: string; contentType: string }[] = []
          try {
            const { data: full } = await resend.emails.receiving.get(email.id)
            bodyHtml = sanitize(full?.html)
            bodyText = sanitize(full?.text)
            incomingMessageId = (full as any)?.message_id ?? null
            if (Array.isArray((full as any)?.attachments)) {
              attachments = (full as any).attachments
                .filter((a: any) => a.filename || a.name)
                .map((a: any) => ({
                  filename: a.filename ?? a.name ?? 'attachment',
                  contentType: a.content_type ?? a.contentType ?? 'application/octet-stream',
                }))
            }
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
              ...(attachments.length ? { attachments } : {}),
              ...(threadId ? { threadId } : {}),
              ...(linkedUser ? { linkedUser } : {}),
            } as any,
            overrideAccess: true,
          })
          imported++
        }
      }

      // ── Sync sent (outbound) emails from support@hogapay.com only ──────────
      const rawFrom = process.env.RESEND_FROM_EMAIL || 'support@hogapay.com'
      const SUPPORT_ADDRESS = (
        rawFrom.match(/<([^>]+)>$/) ? rawFrom.match(/<([^>]+)>$/)![1] : rawFrom
      ).toLowerCase()
      let sentCursor: string | undefined
      let sentHasMore = true
      const bareEmail = (e: string) => e.replace(/^.*<(.+)>$/, '$1').trim()

      while (sentHasMore) {
        const sentResp = await fetch(
          `https://api.resend.com/emails?limit=100${sentCursor ? `&after=${sentCursor}` : ''}`,
          { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } },
        ).then((r) => r.json())

        const sentEmails: any[] = sentResp.data ?? []
        sentHasMore = sentResp.has_more ?? false
        if (sentEmails.length === 0) break

        for (const email of sentEmails) {
          sentCursor = email.id

          // Only track emails sent from the support address
          const fromBare = bareEmail(email.from ?? '')
          if (!fromBare.toLowerCase().includes(SUPPORT_ADDRESS)) {
            skipped++
            continue
          }

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

          // Fetch full body
          let bodyHtml: string | null = null
          let bodyText: string | null = null
          try {
            const { data: full } = await resend.emails.get(email.id)
            bodyHtml = sanitize(full?.html)
            bodyText = sanitize(full?.text)
          } catch {}

          const toList: string[] = Array.isArray(email.to) ? email.to : email.to ? [email.to] : []

          let linkedUser: string | null = null
          try {
            const firstRecipient = bareEmail(toList[0] ?? '')
            if (firstRecipient) {
              const userResult = await req.payload.find({
                collection: 'users',
                where: { email: { equals: firstRecipient } },
                limit: 1,
                overrideAccess: true,
              })
              if (userResult.docs.length > 0) linkedUser = userResult.docs[0].id as string
            }
          } catch {}

          const statusMap: Record<string, string> = {
            delivered: 'sent',
            sent: 'sending',
            bounced: 'failed',
            failed: 'failed',
          }

          await req.payload.create({
            collection: 'emails',
            data: {
              direction: 'outbound',
              from: email.from ?? '',
              to: toList.map((e) => ({ email: bareEmail(e) })),
              subject: email.subject ?? '(No subject)',
              bodyHtml,
              bodyText,
              resendEmailId: email.id,
              status: (statusMap[email.last_event] ?? 'sent') as any,
              isRead: true,
              sentAt: email.created_at,
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
