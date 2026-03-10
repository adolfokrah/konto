import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { generateAndSendOtp, generateOTPCode } from '@/utilities/otp'
import { emailService } from '@/utilities/emailService'
import { sendSMS } from '@/utilities/sms'

// In-memory OTP store for pre-registration users (keyed by countryCode+phoneNumber)
// For existing users, OTP is stored on the user document
export const otpStore = new Map<string, { code: string; expiry: Date; attempts: number }>()

const OTP_VALIDITY_MINUTES = 5

export const sendOTP = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { countryCode, phoneNumber, email } = req.data || {}

    // Normalize phone number: strip leading 0 (e.g. 0245... → 245...)
    const formattedPhoneNumber =
      phoneNumber?.startsWith('0') && phoneNumber.length > 1
        ? phoneNumber.substring(1)
        : phoneNumber

    if (!formattedPhoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'Missing required field: phoneNumber is required',
          errors: [{ field: 'phoneNumber', message: 'Phone number is required' }],
        },
        { status: 400 },
      )
    }

    if (!countryCode) {
      return Response.json(
        {
          success: false,
          message: 'Missing required field: countryCode is required',
          errors: [{ field: 'countryCode', message: 'Country code is required' }],
        },
        { status: 400 },
      )
    }

    // Try to find existing user
    const userResult = await req.payload.find({
      collection: 'users',
      where: {
        phoneNumber: { equals: formattedPhoneNumber },
        countryCode: { equals: countryCode },
      },
      limit: 1,
    })

    const isDemoUser = userResult.docs.length > 0 && userResult.docs[0].demoUser === true

    if (userResult.docs.length > 0) {
      // Existing user — store OTP on document and send via shared utility
      await generateAndSendOtp(req.payload, userResult.docs[0].id, {
        phone: `${countryCode}${formattedPhoneNumber}`,
        email,
        isDemoUser,
      })
    } else {
      // Pre-registration user — store OTP in memory and send via SMS
      const code = generateOTPCode()
      const expiry = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000)
      const key = `${countryCode}${formattedPhoneNumber}`
      otpStore.set(key, { code, expiry, attempts: 0 })
      await sendSMS(
        `${countryCode}${formattedPhoneNumber}`,
        `Your Hogapay verification code is: ${code}. Do not share this with anyone.`,
      )
      if (email) {
        await emailService.sendOTPEmail(email, code)
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
    console.error('Error sending OTP:', error)
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
