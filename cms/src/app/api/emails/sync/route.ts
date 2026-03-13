import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getResend } from '@/utilities/initalise'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resend = getResend()
    let imported = 0
    let skipped = 0
    let cursor: string | undefined
    let hasMore = true

    while (hasMore) {
      const { data, error } = await (resend.emails as any).receiving.list({
        limit: 100,
        ...(cursor ? { after: cursor } : {}),
      })

      if (error) throw new Error(error.message ?? 'Resend API error')

      const emails: any[] = data?.data ?? []
      hasMore = data?.has_more ?? false

      for (const email of emails) {
        cursor = email.id

        const existing = await payload.find({
          collection: 'emails',
          where: { resendEmailId: { equals: email.id } },
          limit: 1,
          overrideAccess: true,
        })
        if (existing.docs.length > 0) {
          skipped++
          continue
        }

        // Fetch full body via SDK
        let bodyHtml: string | null = null
        let bodyText: string | null = null
        try {
          const { data: full } = await (resend.emails as any).receiving.get(email.id)
          bodyHtml = full?.html ?? null
          bodyText = full?.text ?? null
        } catch {
          // proceed without body
        }

        const toList: string[] = Array.isArray(email.to) ? email.to : [email.to]

        let linkedUser: string | null = null
        try {
          const userResult = await payload.find({
            collection: 'users',
            where: { email: { equals: email.from } },
            limit: 1,
            overrideAccess: true,
          })
          if (userResult.docs.length > 0) linkedUser = userResult.docs[0].id as string
        } catch {}

        await payload.create({
          collection: 'emails',
          data: {
            direction: 'inbound',
            from: email.from,
            to: toList.map((e: string) => ({ email: e })),
            subject: email.subject ?? '(No subject)',
            bodyHtml,
            bodyText,
            resendEmailId: email.id,
            status: 'received',
            isRead: false,
            sentAt: email.created_at,
            ...(linkedUser ? { linkedUser } : {}),
          } as any,
          overrideAccess: true,
        })

        imported++
      }
    }

    return NextResponse.json({ imported, skipped })
  } catch (err) {
    console.error('[emails/sync] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
