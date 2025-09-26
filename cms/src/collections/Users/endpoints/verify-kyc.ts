import type { PayloadRequest } from 'payload'
import { sendSMS } from '@/utilities/sms'
import { resend } from '@payload-config'
import kycVerified from '@/components/emailTemplates/kycVerified'
import {
  DiditKYC,
  isSessionCompleted,
  isSessionFailed,
  isSessionPending,
} from '@/utilities/diditKyc'

export const verifyKYC = async (req: PayloadRequest) => {
  try {
    // Get sessionId from query parameters for GET request
    const { verificationSessionId: sessionId } = req.query || {}
    if (!sessionId) {
      return Response.json(
        {
          success: false,
          message: 'Session ID is required',
        },
        { status: 400 },
      )
    }

    // Initialize Didit KYC service with environment variables
    const apiKey = process.env.DIDIT_KYC_API_KEY!
    const workflowId = process.env.DIDIT_WORKFLOW_ID!
    const diditKyc = new DiditKYC(apiKey, workflowId)

    // Get session status from Didit
    const sessionStatus = await diditKyc.getSessionStatus(sessionId as string)

    if (!sessionStatus) {
      return Response.json(
        {
          success: false,
          message: 'Session not found or invalid',
        },
        { status: 404 },
      )
    }

    // Find user with this KYC session ID
    const users = await req.payload.find({
      collection: 'users',
      where: {
        kycSessionId: {
          equals: sessionId,
        },
      },
      limit: 1,
    })

    if (!users.docs.length) {
      return Response.json(
        {
          success: false,
          message: 'User not found for this session',
        },
        { status: 404 },
      )
    }

    const user = users.docs[0]

    // Update user's KYC status based on session status using helper functions
    let newKycStatus: 'none' | 'pending' | 'verified' = 'pending'

    if (isSessionCompleted(sessionStatus.status)) {
      newKycStatus = 'verified'
    } else if (isSessionFailed(sessionStatus.status)) {
      newKycStatus = 'none'
    } else if (isSessionPending(sessionStatus.status)) {
      newKycStatus = 'pending'
    }

    // Update user in database if status is failed/declined
    if (isSessionFailed(sessionStatus.status)) {
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          kycStatus: 'none',
          isKYCVerified: false,
        },
      })

      await sendSMS(
        user.phoneNumber,
        `${user.fullName}, Unfortunately, your KYC verification was not successful. Please try again or contact support for assistance.`,
      )
    }

    // Send notifications if KYC is verified
    if (newKycStatus === 'verified') {
      // Send SMS notification
      if (user.phoneNumber) {
        await sendSMS(
          user.phoneNumber,
          `${user.fullName}, Congratulations! Your KYC verification has been approved. You can now access all features of your account.`,
        )
      }

      // Update user in database
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          kycStatus: newKycStatus,
          isKYCVerified: true,
        },
      })

      // Send email notification
      if (user.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@konto.com',
          to: user.email,
          subject: 'KYC Verification Approved',
          react: kycVerified({
            fullname: user.fullName || 'User',
          }),
        })
      }
    }

    // Redirect to homepage after successful KYC verification
    return Response.redirect(process.env.NEXT_PUBLIC_SERVER_URL || 'https://usehoga.com', 302)
  } catch (error: any) {
    console.error('Error updating KYC status:', error)
    return Response.json(
      {
        success: false,
        message: 'Internal server error during KYC verification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
