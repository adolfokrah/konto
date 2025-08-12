import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const checkPhoneNumberExistence = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    
    const { phoneNumber, countryCode } = req.data || {}

    if (!phoneNumber) {
      return Response.json({
        success: false,
        message: 'Phone number is required',
      }, { status: 400 })
    }

    if (!countryCode) {
      return Response.json({
        success: false,
        message: 'Country code is required',
      }, { status: 400 })
    }

    // Find the user with the phone number and country code
    const existingUser = await req.payload.find({
      collection: 'users',
      where: {
        phoneNumber: {
          equals: phoneNumber,
        },
        countryCode: {
          equals: countryCode,
        },
      },
      limit: 1,
    })


    return Response.json({
      success: true,
      exists: existingUser.docs.length > 0,
      message: existingUser.docs.length > 0 
        ? 'Phone number found in system' 
        : 'Phone number not found in system',
    })
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Error checking phone number',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
