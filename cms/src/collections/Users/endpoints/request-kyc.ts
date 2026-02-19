import { createDiditKYC } from '@/utilities/diditKyc'
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

    // Initialize the service
    const kycService = createDiditKYC()

    // Create a new KYC session for a user
    const session = await kycService.createSession(user.id, {
      callbackUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/verify-kyc`,
      language: 'en',
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
        // kycStatus: 'pending',
      },
      overrideAccess: true,
    })

    const data = {
      sessionId: session.session_id,
      sessionToken: session.session_token,
      sessionUrl: session.verification_url,
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
