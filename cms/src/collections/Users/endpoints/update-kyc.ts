import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { sendSMS } from '@/utilities/sms'
import { emailService } from '@/utilities/emailService'

export const updateKYC = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { userId, kycStatus } = req.data || {}

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

    // Prepare the update data
    const updateData: any = {}

    if (kycStatus) updateData.kycStatus = kycStatus

    const user = await req.payload.update({
      collection: 'users',
      id: userId,
      data: updateData,
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

    // Send SMS notification and email if KYC is verified
    if (kycStatus === 'verified') {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()

      if (process.env.NODE_ENV !== 'test') {
        const message = `Hello ${fullName}, your KYC verification was successful, please restart the app to continue using it. Thank you!`
        await sendSMS([user.phoneNumber], message)
      }

      await emailService.sendKycVerificationEmail(user.email, fullName)
    }

    return Response.json(
      {
        success: true,
        message: 'KYC data updated successfully',
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
