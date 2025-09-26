import type { PayloadRequest } from 'payload'
import { createHmac, timingSafeEqual } from 'crypto'
import type { DiditWebhookPayload } from '@/utilities/diditKyc'
const { verifyKYC } = await import('./verify-kyc')

export const diditWebhook = async (req: PayloadRequest) => {
  try {
    console.log('🔔 Didit webhook received')

    // Get headers
    const signature = req.headers.get('X-Signature') || req.headers.get('x-signature')
    const timestamp = req.headers.get('X-Timestamp') || req.headers.get('x-timestamp')

    // Get webhook secret from environment
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('❌ DIDIT_WEBHOOK_SECRET not configured')
      return Response.json({ message: 'Webhook secret not configured' }, { status: 500 })
    }

    if (!signature || !timestamp) {
      console.error('❌ Missing required headers:', {
        signature: !!signature,
        timestamp: !!timestamp,
      })
      return Response.json({ message: 'Missing required headers' }, { status: 401 })
    }

    // Get raw body - PayloadCMS should provide this
    let rawBody: string
    try {
      rawBody = JSON.stringify(req.body || {})
    } catch (error) {
      console.error('❌ Failed to get raw body:', error)
      return Response.json({ message: 'Invalid request body' }, { status: 400 })
    }

    console.log('📋 Webhook validation data:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: rawBody.length,
      timestamp,
    })

    // Validate timestamp (within 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000)
    const incomingTime = parseInt(timestamp, 10)
    if (Math.abs(currentTime - incomingTime) > 300) {
      console.error('❌ Request timestamp is stale:', {
        currentTime,
        incomingTime,
        diff: Math.abs(currentTime - incomingTime),
      })
      return Response.json({ message: 'Request timestamp is stale' }, { status: 401 })
    }

    // Generate expected signature
    const hmac = createHmac('sha256', webhookSecret)
    const expectedSignature = hmac.update(rawBody).digest('hex')

    // Compare signatures using timing-safe comparison
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf8')
    const providedSignatureBuffer = Buffer.from(signature, 'utf8')

    if (
      expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
      !timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
    ) {
      console.error('❌ Invalid signature:', {
        expected: expectedSignature,
        provided: signature,
        expectedLength: expectedSignatureBuffer.length,
        providedLength: providedSignatureBuffer.length,
      })
      return Response.json(
        {
          message: `Invalid signature. Expected: ${expectedSignature}, Provided: ${signature}`,
        },
        { status: 401 },
      )
    }

    console.log('✅ Webhook signature validated successfully')

    // Parse the webhook payload
    const payload: DiditWebhookPayload = JSON.parse(rawBody)

    console.log('📨 Webhook payload:', {
      session_id: payload.session_id,
      status: payload.status,
      webhook_type: payload.webhook_type,
      vendor_data: payload.vendor_data,
      has_decision: !!payload.decision,
    })

    // Call the existing verify-kyc function to handle the verification logic
    console.log('🔄 Calling verify-kyc function for session:', payload.session_id)

    // Create a mock request object with the session ID in query params
    const mockReq = {
      ...req,
      query: {
        verificationSessionId: payload.session_id,
      },
    }

    try {
      const verifyResult = await verifyKYC(mockReq)

      // Check if the verification was successful
      if (verifyResult.status === 200) {
        console.log('✅ verify-kyc completed successfully')
        return Response.json(
          {
            message: 'Webhook processed successfully via verify-kyc',
            session_id: payload.session_id,
            status: payload.status,
          },
          { status: 200 },
        )
      } else {
        console.error('❌ verify-kyc returned error status:', verifyResult.status)
        const errorText = await verifyResult.text()
        console.error('Error details:', errorText)

        return Response.json(
          {
            message: 'Webhook processing failed',
            session_id: payload.session_id,
            error: errorText,
          },
          { status: verifyResult.status },
        )
      }
    } catch (verifyError) {
      console.error('🚨 Error calling verify-kyc:', verifyError)
      return Response.json(
        {
          message: 'Error processing verification',
          session_id: payload.session_id,
          error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error('🚨 Webhook processing error:', error)
    return Response.json(
      {
        message: 'Internal server error processing webhook',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
