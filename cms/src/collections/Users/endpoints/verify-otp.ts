import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { otpStore } from './send-otp'

const MAX_OTP_ATTEMPTS = 5

export const verifyOTP = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { phoneNumber, countryCode, code } = req.data || {}

    if (!phoneNumber || !countryCode || !code) {
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: phoneNumber, countryCode, and code are required',
        },
        { status: 400 },
      )
    }

    // Try to find existing user first
    const userResult = await req.payload.find({
      collection: 'users',
      where: {
        phoneNumber: { equals: phoneNumber },
        countryCode: { equals: countryCode },
      },
      limit: 1,
    })

    if (userResult.docs.length > 0) {
      const user = userResult.docs[0]

      // Check rate limiting
      if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
        return Response.json(
          {
            success: false,
            verified: false,
            message: 'Too many failed attempts. Please request a new OTP.',
          },
          { status: 429 },
        )
      }

      // Check if OTP exists and is not expired
      if (!user.otpCode || !user.otpExpiry) {
        return Response.json(
          {
            success: false,
            verified: false,
            message: 'No OTP found. Please request a new one.',
          },
          { status: 400 },
        )
      }

      const isExpired = new Date() > new Date(user.otpExpiry)
      if (isExpired) {
        // Clear expired OTP
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: { otpCode: '', otpExpiry: '', otpAttempts: 0 },
        })
        return Response.json(
          {
            success: false,
            verified: false,
            message: 'OTP has expired. Please request a new one.',
          },
          { status: 400 },
        )
      }

      // Verify OTP
      if (user.otpCode !== code) {
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: { otpAttempts: (user.otpAttempts || 0) + 1 },
        })
        return Response.json(
          {
            success: false,
            verified: false,
            message: 'Invalid OTP. Please try again.',
          },
          { status: 400 },
        )
      }

      // OTP is valid — clear it
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: { otpCode: '', otpExpiry: '', otpAttempts: 0 },
      })

      return Response.json(
        { success: true, verified: true, message: 'OTP verified successfully' },
        { status: 200 },
      )
    }

    // Check in-memory store for pre-registration users
    const key = `${countryCode}${phoneNumber}`
    const stored = otpStore.get(key)

    if (!stored) {
      return Response.json(
        {
          success: false,
          verified: false,
          message: 'No OTP found. Please request a new one.',
        },
        { status: 400 },
      )
    }

    // Check rate limiting
    if (stored.attempts >= MAX_OTP_ATTEMPTS) {
      otpStore.delete(key)
      return Response.json(
        {
          success: false,
          verified: false,
          message: 'Too many failed attempts. Please request a new OTP.',
        },
        { status: 429 },
      )
    }

    // Check expiry
    if (new Date() > stored.expiry) {
      otpStore.delete(key)
      return Response.json(
        {
          success: false,
          verified: false,
          message: 'OTP has expired. Please request a new one.',
        },
        { status: 400 },
      )
    }

    // Verify OTP
    if (stored.code !== code) {
      stored.attempts += 1
      return Response.json(
        {
          success: false,
          verified: false,
          message: 'Invalid OTP. Please try again.',
        },
        { status: 400 },
      )
    }

    // OTP is valid — clear it
    otpStore.delete(key)

    return Response.json(
      { success: true, verified: true, message: 'OTP verified successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error verifying OTP:', error)
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
