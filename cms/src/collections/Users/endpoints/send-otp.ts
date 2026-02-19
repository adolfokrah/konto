import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { emailService } from '@/utilities/emailService'
import { sendSMS } from '@/utilities/sms'

// In-memory OTP store for pre-registration users (keyed by countryCode+phoneNumber)
// For existing users, OTP is stored on the user document
export const otpStore = new Map<string, { code: string; expiry: Date; attempts: number }>()

function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const OTP_VALIDITY_MINUTES = 5

export const sendOTP = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { countryCode, phoneNumber, email } = req.data || {}

    if (!phoneNumber) {
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
        phoneNumber: { equals: phoneNumber },
        countryCode: { equals: countryCode },
      },
      limit: 1,
    })

    const isDemoUser = userResult.docs.length > 0 && userResult.docs[0].demoUser === true

    // Demo users always get 123456; real users get a random code
    const code = isDemoUser ? '123456' : generateOTPCode()
    const expiry = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000)

    if (userResult.docs.length > 0) {
      // Store OTP on existing user document
      await req.payload.update({
        collection: 'users',
        id: userResult.docs[0].id,
        data: {
          otpCode: code,
          otpExpiry: expiry.toISOString(),
          otpAttempts: 0,
        },
      })
    } else {
      // Store OTP in memory for pre-registration users
      const key = `${countryCode}${phoneNumber}`
      otpStore.set(key, { code, expiry, attempts: 0 })
    }

    // Skip SMS/email for demo users
    if (!isDemoUser) {
      // Send OTP via email
      if (email) {
        await emailService.sendOTPEmail(email, code)
      }

      // Send OTP via SMS
      if (phoneNumber && countryCode) {
        const fullPhoneNumber = `${countryCode}${phoneNumber}`

        await sendSMS(
          fullPhoneNumber,
          `Your hoga verification code is: ${code}. Do not share this code with anyone.`,
        )
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
