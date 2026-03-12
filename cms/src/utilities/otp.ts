import type { BasePayload } from 'payload'
import { emailService } from '@/utilities/emailService'
import { sendSMS } from '@/utilities/sms'

const OTP_VALIDITY_MINUTES = 5

export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Generates an OTP, stores it on the user document, and sends it via SMS + email.
 * Returns the generated code (for use in response messages).
 */
export async function generateAndSendOtp(
  payload: BasePayload,
  userId: string,
  {
    phone,
    email,
    isDemoUser,
    message,
  }: {
    phone: string
    email?: string | null
    isDemoUser?: boolean
    message?: string
  },
): Promise<string> {
  const code = isDemoUser ? '123456' : generateOTPCode()
  const expiry = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000)

  await payload.update({
    collection: 'users',
    id: userId,
    data: { otpCode: code, otpExpiry: expiry.toISOString(), otpAttempts: 0 },
    overrideAccess: true,
  })

  if (!isDemoUser) {
    const smsTemplate =
      message ?? `Your Hogapay verification code is: {code}. Do not share this with anyone.`
    const smsText = smsTemplate.replace('{code}', code)
    // Fire-and-forget — don't block the response on external SMS/email APIs
    try {
      await sendSMS(phone, smsText)
    } catch (err) {
      console.error('OTP SMS error:', err)
    }
    if (email) {
      await emailService
        .sendOTPEmail(email, code)
        .catch((err) => console.error('OTP email error:', err))
    }
  }

  return code
}
