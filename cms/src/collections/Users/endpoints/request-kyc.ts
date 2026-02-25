import { createDiditKYC } from '@/utilities/diditKyc'
import { emailService } from '@/utilities/emailService'
import { sendSMS } from '@/utilities/sms'
import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const requestKYC = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { user } = req

    if (!user) {
      return Response.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const userEmail = user.email as string | undefined
    const userPhone = user.phoneNumber as string | undefined
    const countryCode = (user.countryCode as string) || '233'

    // Initialize the service
    const kycService = createDiditKYC()

    // Create a new KYC session for a user
    const session = await kycService.createSession(user.id, {
      callbackUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/verify-kyc`,
      language: 'en',
      contactDetails: {
        ...(userEmail && { email: userEmail }),
        ...(userPhone && { phone: `+${countryCode}${userPhone}` }),
      },
      expectedDetails: {
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        country: user?.country?.toLowerCase() === 'ghana' ? 'GHA' : 'GHA',
      },
    })

    console.log(
      'Didit v3 session created for user:',
      user.id,
      'response:',
      JSON.stringify(session, null, 2),
    )

    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        kycSessionId: session.session_id,
      },
      overrideAccess: true,
    })

    const verificationUrl = session.url

    // Send verification link via email and SMS
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

    if (userEmail) {
      emailService
        .sendKycEmail(userEmail, verificationUrl)
        .catch((err) => console.error('Failed to send KYC email:', err))
    }

    if (userPhone) {
      const phoneWithCode = `${countryCode}${userPhone}`
      sendSMS(
        [phoneWithCode],
        `Hi ${fullName || 'there'}, please complete your Hoga identity verification here: ${verificationUrl}`,
      ).catch((err) => console.error('Failed to send KYC SMS:', err))
    }

    const data = {
      sessionId: session.session_id,
      sessionToken: session.session_token,
      sessionUrl: verificationUrl,
      status: session.status,
    }

    return Response.json(
      {
        success: true,
        message: 'KYC session created successfully',
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('KYC session creation error:', error instanceof Error ? error.message : error)
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create KYC session',
      },
      { status: 500 },
    )
  }
}
