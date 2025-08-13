import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const registerUser = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { phoneNumber, countryCode, country, fullName, email } = req.data || {}
    // Validate required fields
    if (!phoneNumber || !countryCode || !country || !fullName) {
      return Response.json({
        success: false,
        message: 'Missing required fields: phoneNumber, countryCode, country, fullName are required',
        errors: []
      }, { status: 400 })
    }

    // Check if user already exists with this phone number and country code
    const existingUserByPhone = await req.payload.find({
      collection: 'users',
      where: {
        and: [
          {
            phoneNumber: {
              equals: phoneNumber,
            },
          },
          {
            countryCode: {
              equals: countryCode,
            },
          }
        ],
      },
    })

    if (existingUserByPhone.docs.length > 0) {
      return Response.json({
        success: false,
        message: 'User already exists with this phone number',
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number already registered'
          }
        ]
      }, { status: 409 })
    }

    // If email is provided, check if user already exists with this email
    if (email) {
      const existingUserByEmail = await req.payload.find({
        collection: 'users',
        where: {
          email: {
            equals: email,
          },
        },
      })

      if (existingUserByEmail.docs.length > 0) {
        return Response.json({
          success: false,
          message: 'User already exists with this email',
          errors: [
            {
              field: 'email',
              message: 'Email already registered'
            }
          ]
        }, { status: 409 })
      }
    }


    // Create the new user - Include email and password for auth
    const userEmail = email || `${phoneNumber.replace(/\+/g, '')}@konto.app` // Generate email if not provided
    const defaultPassword = '123456' // Default password for all users
    
    const newUser = await req.payload.create({
      collection: 'users',
      data: {
        email: userEmail,
        password: defaultPassword,
        phoneNumber,
        countryCode,
        country,
        fullName,
        isKYCVerified: false,
        appSettings: {
          language: 'en',
          darkMode: false,
          biometricAuthEnabled: false,
          notificationsSettings: {
            pushNotificationsEnabled: true,
            emailNotificationsEnabled: true,
            smsNotificationsEnabled: false,
          },
        },
      } as any, // Use any to bypass type checking for now
    })


    // Return success response with user data (without token for testing)
    return Response.json({
      success: true,
      message: 'User registered successfully',
      doc: newUser,
      user: newUser, // For backward compatibility
    }, { status: 201 })

  } catch (error: any) {
    // Log error in development only
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('💥 Registration error:', error)
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = error.data?.map((err: any) => ({
        field: err.field,
        message: err.message
      })) || []
      
      return Response.json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      }, { status: 400 })
    }

    // Handle duplicate key errors (in case of race conditions)
    if (error.code === 11000) {
      return Response.json({
        success: false,
        message: 'User already exists with this phone number',
        errors: [
          {
            field: 'phoneNumber',
            message: 'Phone number already registered'
          }
        ]
      }, { status: 409 })
    }

    // Generic error response
    return Response.json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
