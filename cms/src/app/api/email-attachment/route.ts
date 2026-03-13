import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    // Auth check via Payload session
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const resendEmailId = searchParams.get('emailId')
    const index = Number(searchParams.get('index') ?? '0')
    const direction = searchParams.get('direction') ?? 'inbound'
    const fallbackFilename = searchParams.get('filename') ?? 'attachment'

    if (!resendEmailId) {
      return NextResponse.json({ error: 'Missing emailId' }, { status: 400 })
    }

    // Inbound emails use the /receiving/ path; outbound use /emails/ directly
    const basePath =
      direction === 'inbound'
        ? `https://api.resend.com/emails/receiving/${resendEmailId}/attachments`
        : `https://api.resend.com/emails/${resendEmailId}/attachments`

    const res = await fetch(basePath, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[email-attachment] Resend error', res.status, text)
      return NextResponse.json(
        { error: 'Failed to fetch attachments from Resend' },
        { status: 502 },
      )
    }

    const json = await res.json()
    // Resend may return { data: [...] } or { attachments: [...] } or a bare array
    const attachments: any[] = Array.isArray(json) ? json : (json.data ?? json.attachments ?? [])
    const att = attachments[index]

    if (!att) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const downloadUrl = att.download_url ?? att.url
    if (!downloadUrl) {
      return NextResponse.json({ error: 'No download URL available' }, { status: 404 })
    }

    // Proxy the bytes so images render inline (redirecting to a signed URL may return
    // Content-Disposition: attachment which browsers won't display in <img> tags)
    const fileRes = await fetch(downloadUrl)
    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch attachment file' }, { status: 502 })
    }

    const contentType =
      att.content_type ??
      att.contentType ??
      fileRes.headers.get('content-type') ??
      'application/octet-stream'
    // Prefer our stored filename (passed as query param) over whatever Resend returns
    const filename =
      fallbackFilename !== 'attachment'
        ? fallbackFilename
        : (att.filename ?? att.name ?? fallbackFilename)
    const buffer = await fileRes.arrayBuffer()

    // HTTP headers must be ASCII; strip/replace any non-ASCII chars in the filename
    const safeFilename = filename.replace(/[^\x20-\x7E]/g, '_')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[email-attachment]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
