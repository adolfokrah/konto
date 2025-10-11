import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { emailService } from '@/utilities/emailService'
import { sendSMS } from '@/utilities/sms'
import { WhatsAppClient } from '@/utilities/whatsap'
export const sendOTP = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { countryCode, phoneNumber, code, email } = req.data || {}
    if (!code) {
      return Response.json(
        {
          success: false,
          message: 'Missing required field: code is required',
          errors: [
            {
              field: 'code',
              message: `OTP code is required`,
            },
          ],
        },
        { status: 400 },
      )
    }

    if (!phoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'Missing required field: phoneNumber is required',
          errors: [
            {
              field: 'phoneNumber',
              message: `Phone number is required`,
            },
          ],
        },
        { status: 400 },
      )
    }
    // send email otp
    if (email) {
      await emailService.sendOTPEmail(email, code)
    }

    if (phoneNumber && countryCode) {
      const fullPhoneNumber = countryCode ? `${countryCode}${phoneNumber}` : phoneNumber
      // Send SMS OTP
      await sendSMS(
        fullPhoneNumber,
        `Your hoga verification code is: ${code}. Do not share this code with anyone.`,
      )

      // Send WhatsApp OTP
      try {
        const whatsappClient = new WhatsAppClient()
        await whatsappClient.sendText({
          to: fullPhoneNumber,
          text: `Your hoga verification code is: ${code}. Do not share this code with anyone.`,
        })
      } catch (whatsappError) {
        console.warn('WhatsApp OTP failed, SMS sent as fallback:', whatsappError)
      }
    }

    return Response.json(
      {
        success: true,
        message: 'OTP sent successfully',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error)
    return Response.json(
      {
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
