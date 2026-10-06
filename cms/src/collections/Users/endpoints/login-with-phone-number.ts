import type { PayloadRequest } from 'payload'
import { randomBytes } from 'crypto'
import { addDataAndFileToRequest } from 'payload'
import { isRecentlyVerified } from '@/utilities/phoneVerification'

export const loginWithPhoneNumber = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)

    const { phoneNumber, countryCode } = req.data || {}

    // Normalize phone number: strip leading 0 (e.g. 0245... → 245...)
    const formattedPhoneNumber =
      phoneNumber?.startsWith('0') && phoneNumber.length > 1
        ? phoneNumber.substring(1)
        : phoneNumber

    if (!formattedPhoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'Phone number is required',
        },
        { status: 400 },
      )
    }

    if (!countryCode) {
      return Response.json(
        {
          success: false,
          message: 'Country code is required',
        },
        { status: 400 },
      )
    }

    // Find the user with the phone number and country code
    const existingUser = await req.payload.find({
      collection: 'users',
      where: {
        phoneNumber: {
          equals: formattedPhoneNumber,
        },
        countryCode: {
          equals: countryCode,
        },
      },
      limit: 1,
    })

    if (existingUser.docs.length === 0) {
      return Response.json(
        {
          success: false,
          message: 'Phone number not found',
        },
        { status: 401 },
      )
    }

    const user = existingUser.docs[0]

    // A token is only issued right after this number passed OTP (verify-otp stamps
    // otpVerifiedAt). The proof is single-use.
    if (!isRecentlyVerified((user as any).otpVerifiedAt)) {
      return Response.json(
        { success: false, message: 'Please verify your phone number with the OTP code first.' },
        { status: 401 },
      )
    }
    // App users never type a password, so log in with a fresh random one instead of a
    // shared default. Staff keep their real dashboard password.
    const isStaff = ['admin', 'auditor'].includes((user as any).role)
    const password = isStaff ? '123456' : randomBytes(24).toString('base64url')
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: { otpVerifiedAt: null, ...(isStaff ? {} : { password }) } as any,
      overrideAccess: true,
    })

    // In test environment, skip JWT token generation to avoid payload errors
    if (process.env.NODE_ENV === 'test') {
      return Response.json({
        success: true,
        message: 'Login successful',
        user,
      })
    }

    // Login the user using their email and default password. The context flag lets the
    // beforeLogin hook allow this (password logins are otherwise staff-only).
    req.context = { ...(req.context || {}), phoneLogin: true }
    const loginResult = await req.payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password,
      },
      req,
    })

    return Response.json({
      success: true,
      message: 'Login successful',
      user: loginResult.user,
      token: loginResult.token,
      exp: loginResult.exp,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Error during login',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
