import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const captureType = searchParams.get('type') || 'manual'

    console.log(`Testing Sentry error capture with type: ${captureType}`)

    switch (captureType) {
      case 'manual':
        // Manually capture an exception
        Sentry.captureException(new Error('Manually captured test error from API'))
        return NextResponse.json({
          success: true,
          message: 'Manual error captured and sent to Sentry',
        })

      case 'throw':
        // Throw an error that should be automatically captured
        throw new Error('Test error thrown from API endpoint')

      case 'async':
        // Simulate an async error
        await new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Test async error from API endpoint'))
          }, 100)
        })
        break

      case 'message':
        // Capture a message
        Sentry.captureMessage('Test message from API endpoint', 'info')
        return NextResponse.json({
          success: true,
          message: 'Message captured and sent to Sentry',
        })

      default:
        return NextResponse.json(
          {
            success: false,
            message: `Unknown capture type: ${captureType}`,
          },
          { status: 400 },
        )
    }

    return NextResponse.json({
      success: true,
      message: `Error handled for type: ${captureType}`,
    })
  } catch (error) {
    console.error('Test Sentry error:', error)

    // Make sure the error gets to Sentry
    Sentry.captureException(error)

    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    )
  }
}
