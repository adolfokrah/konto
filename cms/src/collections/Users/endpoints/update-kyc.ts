import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { sendSMS } from '@/utilities/sms'
import { resend } from '@payload-config'
import kycVerified from '@/components/emailTemplates/kycVerified'

export const updateKYC = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { userId, frontFileId, backFileId, photoFileId, documentType, kycStatus } = req.data || {}

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

    // Add KYC file IDs if provided
    if (frontFileId) updateData.frontFile = frontFileId
    if (backFileId) updateData.backFile = backFileId
    if (photoFileId) updateData.photoFile = photoFileId
    if (documentType) updateData.documentType = documentType
    if (kycStatus) updateData.kycStatus = kycStatus
    // Set isKYCVerified based on kycStatus
    if (kycStatus === 'verified') {
      updateData.isKYCVerified = true
    } else if (kycStatus === 'pending') {
      updateData.isKYCVerified = false
    }

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

    // Send SMS notification if KYC is verified
    if (kycStatus === 'verified') {
      const message = `Hello ${user.fullName || ''}, your KYC verification was successful. Thank you!`
      sendSMS([user.phoneNumber], message)

      resend.emails.send({
        from: 'Hoga <onboarding@usehoga.com>',
        to: [user.email],
        subject: 'KYC Verification Successful',
        react: kycVerified({ fullname: user.fullName || '' }),
      })
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
