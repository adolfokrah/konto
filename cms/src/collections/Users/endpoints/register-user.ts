import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const registerUser = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    
    const { phoneNumber, countryCode, country, fullName, email } = req.data || {}
    
    console.log('📝 Registration request received:', {
      phoneNumber,
      countryCode,
      country,
      fullName,
      email: email ? email.substring(0, 3) + '***' : 'none'
    })

    // Validate required fields
    if (!phoneNumber || !countryCode || !country || !fullName) {
      console.log('❌ Missing required fields')
      return Response.json({
        success: false,
        message: 'Missing required fields: phoneNumber, countryCode, country, fullName are required',
        errors: []
      }, { status: 400 })
    }

    // Check if user already exists with this phone number and country code
    console.log('🔍 Checking if user already exists...')
    const existingUser = await req.payload.find({
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
        or: [
            {
                email: {
                  equals: email || '',
                },
            }
        ]
      },
    })

    if (existingUser.docs.length > 0) {
      console.log('❌ User already exists with this phone number')
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

    console.log('✅ Phone number is available, creating new user...')

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

    console.log('🎉 User created successfully:', newUser.id)

    // Login the user to get the token
    const loginResult = await req.payload.login({
      collection: 'users',
      data: {
        email: userEmail,
        password: defaultPassword,
      },
      req,
    })

    console.log('🔑 User logged in successfully after registration')

    // Return success response with user data and token
    return Response.json({
      success: true,
      message: 'User registered successfully',
      doc: loginResult.user,
      token: loginResult.token,
      user: loginResult.user, // For backward compatibility
    }, { status: 201 })

  } catch (error: any) {
    console.error('💥 Registration error:', error)
    
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
