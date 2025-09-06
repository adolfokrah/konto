import * as Sentry from '@sentry/nextjs'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('[Sentry Debug] API route called')
  console.log('[Sentry Debug] Sentry available:', !!Sentry)
  console.log('[Sentry Debug] DSN configured:', !!process.env.SENTRY_DSN)

  const testType = request.nextUrl.searchParams.get('type') || 'manual'
  console.log('[Sentry Debug] Test type:', testType)

  if (testType === 'auto') {
    // AUTO-CAPTURE: Just throw - Sentry will automatically catch this
    console.log('[Sentry Debug] Testing AUTO error capture...')
    throw new Error('AUTO-CAPTURED: This error will be automatically caught by Sentry!')
  }

  // MANUAL CAPTURE: Handle the error ourselves with custom context
  try {
    console.log('[Sentry Debug] Testing MANUAL error capture...')
    throw new Error('MANUAL-CAPTURED: This error is manually sent to Sentry with extra context!')
  } catch (error) {
    console.log('[Sentry Debug] Caught error, attempting to capture:', error)

    // Explicitly capture with rich context
    const eventId = Sentry.captureException(error, {
      tags: {
        section: 'test-api',
        errorType: 'intentional-test',
        captureMethod: 'manual',
      },
      extra: {
        url: request.url,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        testType: 'manual-capture-demo',
      },
    })

    console.log('[Sentry Debug] Captured exception with event ID:', eventId)
    console.error('Test API error (manually captured):', error)

    return new Response(
      `MANUAL CAPTURE: ${error instanceof Error ? error.message : 'Unknown error'} (Event ID: ${eventId})`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simulate processing the request
    if (body.triggerError) {
      throw new Error(`POST error triggered with data: ${JSON.stringify(body)}`)
    }

    return Response.json({ success: true, message: 'No error triggered' })
  } catch (error) {
    // Capture with additional context
    Sentry.captureException(error, {
      tags: {
        section: 'test-api',
        method: 'POST',
        errorType: 'intentional-test',
      },
      extra: {
        requestBody: await request.text(),
        url: request.url,
      },
    })

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
