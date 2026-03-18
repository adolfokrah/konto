import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { spawn } from 'child_process'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })
    const requestHeaders = await getHeaders()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user || user.role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const uri = process.env.DATABASE_URI
    if (!uri) {
      return Response.json({ success: false, message: 'DATABASE_URI not set' }, { status: 500 })
    }

    const date = new Date().toISOString().split('T')[0]
    const filename = `hogapay-db-backup-${date}.gz`

    const mongodump = spawn('mongodump', ['--uri', uri, '--archive', '--gzip'])

    const stream = new ReadableStream({
      start(controller) {
        mongodump.stdout.on('data', (chunk) => controller.enqueue(chunk))
        mongodump.stdout.on('end', () => controller.close())
        mongodump.stderr.on('data', (chunk) => {
          // mongodump writes progress to stderr, not actual errors — safe to ignore
          console.log('[mongodump]', chunk.toString())
        })
        mongodump.on('error', (err) => {
          console.error('mongodump failed:', err)
          controller.error(err)
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('DB backup failed:', error.message)
    return Response.json({ success: false, message: error.message }, { status: 500 })
  }
}
