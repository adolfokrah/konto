import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const checkUserExistence = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)

    const { phoneNumber, countryCode, email, username } = req.data || {}

    console.log('Check User Existence Called', {
      phoneNumber,
      countryCode,
      email,
      username,
    })

    // Format phone number by removing leading 0 if present
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

    // Check in priority order: username -> email -> phone
    let conflictField = null
    let message = 'Available for registration'
    let existingUser = null

    // 1. Check username first (if provided)
    if (username) {
      const normalizedUsername = username.trim().toLowerCase()
      const userByUsername = await req.payload.find({
        collection: 'users',
        where: {
          username: {
            like: normalizedUsername,
          },
        },
        limit: 1,
      })
      console.log('User by username', userByUsername.docs.length, username)

      if (userByUsername.docs.length > 0) {
        conflictField = 'username'
        message = 'Username already taken'
        existingUser = userByUsername.docs[0]

        return Response.json({
          success: true,
          exists: true,
          conflictField,
          data: {
            email: existingUser.email,
          },
          message,
        })
      }
    }

    // 2. Check email second (if provided)
    if (email) {
      const userByEmail = await req.payload.find({
        collection: 'users',
        where: {
          email: {
            equals: email,
          },
        },
        limit: 1,
      })

      if (userByEmail.docs.length > 0) {
        conflictField = 'email'
        message = 'Email already registered'
        existingUser = userByEmail.docs[0]

        return Response.json({
          success: true,
          exists: true,
          conflictField,
          data: {
            email: existingUser.email,
          },
          message,
        })
      }
    }

    // 3. Check phone number last
    const userByPhone = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          {
            phoneNumber: {
              equals: formattedPhoneNumber,
            },
          },
          {
            countryCode: {
              equals: countryCode,
            },
          },
        ],
      },
      limit: 1,
    })

    if (userByPhone.docs.length > 0) {
      conflictField = 'phoneNumber'
      message = 'Phone number already registered'
      existingUser = userByPhone.docs[0]

      return Response.json({
        success: true,
        exists: true,
        conflictField,
        data: {
          email: existingUser.email,
        },
        message,
      })
    }

    // No conflicts - available for registration
    return Response.json({
      success: true,
      exists: false,
      conflictField: null,
      data: {
        email: email,
      },
      message: 'Available for registration',
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Error checking phone number',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
