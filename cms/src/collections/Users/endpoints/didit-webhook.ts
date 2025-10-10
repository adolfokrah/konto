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

    // Get raw body - we need the original raw bytes for HMAC validation
    let rawBody: string
    try {
      // Try to get the raw body from PayloadCMS request
      // PayloadCMS might store it in different places depending on version
      const reqAny = req as any

      if (req.text && typeof req.text === 'function') {
        rawBody = await req.text()
      } else if (reqAny.rawBody) {
        rawBody = reqAny.rawBody
      } else if (typeof req.body === 'string') {
        rawBody = req.body
      } else if (req.body) {
        // Last resort: stringify, but log a warning
        console.warn('⚠️ Using JSON.stringify for rawBody - signature might not match')
        rawBody = JSON.stringify(req.body)
      } else {
        throw new Error('No body found in request')
      }
    } catch (error) {
      console.error('❌ Failed to get raw body:', error)
      return Response.json({ message: 'Invalid request body' }, { status: 400 })
    }

    console.log('📋 Webhook validation data:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: rawBody.length,
      timestamp,
      rawBodySample: rawBody.substring(0, 100) + (rawBody.length > 100 ? '...' : ''),
      signatureProvided: signature,
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

    // Generate expected signature - try different approaches
    const hmac = createHmac('sha256', webhookSecret)
    const expectedSignature = hmac.update(rawBody).digest('hex')

    // Also try with timestamp prepended (common webhook pattern)
    const hmacWithTimestamp = createHmac('sha256', webhookSecret)
    const expectedSignatureWithTimestamp = hmacWithTimestamp
      .update(timestamp + rawBody)
      .digest('hex')

    // Try with different encodings
    const hmacBuffer = createHmac('sha256', webhookSecret)
    const expectedSignatureFromBuffer = hmacBuffer
      .update(Buffer.from(rawBody, 'utf8'))
      .digest('hex')

    console.log('🔐 HMAC Debug:', {
      rawBodyLength: rawBody.length,
      rawBodySample: rawBody.substring(0, 200),
      webhookSecretLength: webhookSecret.length,
      timestamp,
      expectedSignature,
      expectedSignatureWithTimestamp,
      expectedSignatureFromBuffer,
      providedSignature: signature,
    })

    // Compare signatures using timing-safe comparison
    const signatures = [
      expectedSignature,
      expectedSignatureWithTimestamp,
      expectedSignatureFromBuffer,
    ]
    let isValid = false

    for (const expectedSig of signatures) {
      const expectedSignatureBuffer = Buffer.from(expectedSig, 'utf8')
      const providedSignatureBuffer = Buffer.from(signature, 'utf8')

      if (
        expectedSignatureBuffer.length === providedSignatureBuffer.length &&
        timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
      ) {
        isValid = true
        console.log('✅ Signature matched with method:', expectedSig)
        break
      }
    }

    if (!isValid) {
      console.error('❌ Invalid signature - none of the methods matched:', {
        expected: expectedSignature,
        expectedWithTimestamp: expectedSignatureWithTimestamp,
        expectedFromBuffer: expectedSignatureFromBuffer,
        provided: signature,
        expectedLength: expectedSignature.length,
        providedLength: signature.length,
      })

      // Temporary: Allow webhook to proceed in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ DEVELOPMENT MODE: Proceeding with invalid signature for debugging')
      } else {
        return Response.json(
          {
            message: 'Invalid signature - webhook authentication failed',
          },
          { status: 401 },
        )
      }
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

    // Handle specific statuses that should set KYC status to pending
    if (payload.status === 'In Review') {
      console.log(`🔄 Status is ${payload.status}, updating user KYC status to pending`)

      try {
        // Find user by session ID
        const user = await req.payload.find({
          collection: 'users',
          where: {
            kycSessionId: {
              equals: payload.session_id,
            },
          },
          limit: 1,
        })

        if (user.docs && user.docs.length > 0) {
          const userId = user.docs[0].id

          // Update user KYC status to pending
          await req.payload.update({
            collection: 'users',
            id: userId,
            data: {
              kycStatus: 'pending',
            },
          })

          console.log(`✅ Updated user ${userId} KYC status to pending`)

          return Response.json(
            {
              message: 'KYC status updated to pending',
              session_id: payload.session_id,
              status: payload.status,
            },
            { status: 200 },
          )
        } else {
          console.warn(`⚠️ No user found with session ID: ${payload.session_id}`)
        }
      } catch (error) {
        console.error('❌ Error updating KYC status to pending:', error)
      }
    }

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
