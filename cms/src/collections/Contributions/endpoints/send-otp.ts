import { PayloadRequest } from 'node_modules/payload/dist/types'
import { addDataAndFileToRequest } from 'payload'

import { paystack } from '@/utilities/initalise'

export const sendOtp = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { reference, otp } = req.data || {}

    // Validate required fields
    if (!reference || !otp) {
      return Response.json(
        {
          success: false,
          message: 'Reference and OTP are required',
        },
        { status: 400 },
      )
    }

    const response = await paystack.submitOtp({ reference, otp })

    if (response.status) {
      return Response.json(
        {
          success: true,
          message: 'OTP submitted successfully',
          data: response.data,
        },
        { status: 200 },
      )
    } else {
      return Response.json(
        {
          success: false,
          message: 'OTP submission failed',
          error: response.message || 'Invalid OTP or reference',
          data: response.data,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'Failed to submit OTP',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
