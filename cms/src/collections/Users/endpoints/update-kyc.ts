import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { sendSMS } from '@/utilities/sms'

export const updateKYC = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { userId } = req.data || {}
    if (!userId) {
      return Response.json(
        {
          success: false,
          message: 'Missing required field: userId is required',
          errors: [],
        },
        { status: 400 },
      )
    }

    const user = await req.payload.update({
      collection: 'users',
      id: userId,
      data: { isKYCVerified: true },
      overrideAccess: true,
    })

    if (!user) {
      return Response.json(
        {
          success: false,
          message: 'User not found',
          errors: [
            {
              field: 'userId',
              message: 'No user found with the provided userId',
            },
          ],
        },
        { status: 404 },
      )
    }
    const message = `Hello ${user.fullName || ''}, your KYC verification was successful. Thank you!`
    sendSMS([user.phoneNumber], message)

    return Response.json(
      {
        success: true,
        message: 'KYC status updated successfully',
        user,
      },
      { status: 200 },
    )
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
