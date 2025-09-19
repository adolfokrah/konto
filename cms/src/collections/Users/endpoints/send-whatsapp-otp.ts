import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const sendWhatsAppOtp = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { phoneNumber, code } = req.data || {}

    // Validate required fields
    if (!phoneNumber || !code) {
      return Response.json(
        {
          success: false,
          message: 'Missing required fields: phoneNumber, countryCode, and code are required',
          errors: [
            {
              field: !phoneNumber ? 'phoneNumber' : 'code',
              message: `${!phoneNumber ? 'Phone number' : 'OTP code'} is required`,
            },
          ],
        },
        { status: 400 },
      )
    }

    // Validate OTP code format (should be numeric and reasonable length)
    if (!/^\d{4,8}$/.test(code)) {
      return Response.json(
        {
          success: false,
          message: 'Invalid OTP code format. Code should be 4-8 digits.',
          errors: [
            {
              field: 'code',
              message: 'OTP code must be 4-8 digits',
            },
          ],
        },
        { status: 400 },
      )
    }

    // Format the phone number (combine country code and phone number)
    const fullPhoneNumber = `${phoneNumber.replace(/^0+/, '').replace(/^\+/, '')}`

    // Direct API call to Facebook WhatsApp API (bypassing utility class restrictions)
    // Get credentials from environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    // Validate that environment variables are set
    if (!accessToken) {
      return Response.json(
        {
          success: false,
          message: 'WhatsApp access token not configured',
          errors: [
            {
              field: 'configuration',
              message: 'WHATSAPP_ACCESS_TOKEN environment variable is required',
            },
          ],
        },
        { status: 500 },
      )
    }

    if (!phoneNumberId) {
      return Response.json(
        {
          success: false,
          message: 'WhatsApp phone number ID not configured',
          errors: [
            {
              field: 'configuration',
              message: 'WHATSAPP_PHONE_NUMBER_ID environment variable is required',
            },
          ],
        },
        { status: 500 },
      )
    }

    // Use hoga_otp template with OTP parameter
    const payload = {
      messaging_product: 'whatsapp',
      to: fullPhoneNumber,
      type: 'template',
      template: {
        name: 'hoga_otp',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: code,
              },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              {
                type: 'text',
                text: 'verify-otp', // Adjust this based on your template URL parameter
              },
            ],
          },
        ],
      },
    }

    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (response.ok && result?.messages?.[0]?.id) {
      return Response.json(
        {
          success: true,
          message: 'OTP sent successfully via WhatsApp using hoga_otp template',
          data: {
            phoneNumber: fullPhoneNumber,
            messageId: result.messages[0].id,
            otpCode: code,
            template: 'hoga_otp',
          },
        },
        { status: 200 },
      )
    } else {
      return Response.json(
        {
          success: false,
          message: 'Failed to send WhatsApp message',
          errors: [
            {
              field: 'whatsapp',
              message: result?.error?.message || 'WhatsApp API error',
              details: result,
            },
          ],
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error('Error sending WhatsApp OTP:', error)
    return Response.json(
      {
        success: false,
        message: 'Internal server error while sending OTP',
        errors: [
          {
            field: 'server',
            message: error.message || 'Unknown server error',
          },
        ],
      },
      { status: 500 },
    )
  }
}
