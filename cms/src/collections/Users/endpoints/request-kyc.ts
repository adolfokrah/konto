import { createDiditKYC } from '@/utilities/diditKyc'
import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

// Utility function to extract first and last name from fullName
const extractNames = (fullName: string) => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' }
  }

  const nameParts = fullName.trim().split(/\s+/)

  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' }
  } else if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' }
  } else {
    // Last word is last name, everything else is first name
    const lastName = nameParts[nameParts.length - 1]
    const firstName = nameParts.slice(0, -1).join(' ')
    return { firstName, lastName }
  }
}

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

    // Extract first and last name from user's fullName
    const { firstName, lastName } = extractNames(user.fullName)

    // Initialize the service
    const kycService = createDiditKYC()

    // Create a new KYC session for a user
    const session = await kycService.createSession(user.id, {
      callbackUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/verify-kyc`,
      language: 'en',
      expectedDetails: {
        first_name: firstName,
        last_name: lastName,
        country: user?.country?.toLowerCase() === 'ghana' ? 'GHA' : 'GHA',
      },
    })

    console.log('Didit v3 session response:', JSON.stringify(session, null, 2))

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
