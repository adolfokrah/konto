import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { mobile_money_bank_codes } from '@/lib/constants/bank_codes'
import { paystack } from '@/payload.config'
export const verifyAccountDetails = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { phoneNumber, name, bank } = req.data || {}

    if (!phoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'Phone number is required',
          valid: false,
        },
        { status: 401 },
      )
    }
    if (!bank) {
      return Response.json(
        {
          success: false,
          message: 'Bank is required',
          valid: false,
        },
        { status: 400 },
      )
    }
    if (!name) {
      return Response.json(
        {
          success: false,
          message: 'Name is required',
          valid: false,
        },
        { status: 400 },
      )
    }

    const response = await paystack.verifyAccountDetails({
      account_number: phoneNumber,
      bank_code:
        mobile_money_bank_codes[bank.toLowerCase() as keyof typeof mobile_money_bank_codes],
    })

    if (response.status && response.data) {
      if ((response.data as any).account_name?.toLowerCase() !== name.toLowerCase()) {
        return Response.json(
          {
            success: false,
            message: 'Name does not match account details',
            valid: false,
          },
          { status: 400 },
        )
      }

      return Response.json(
        {
          success: true,
          message: response.data,
          valid: true,
        },
        { status: 200 },
      )
    } else {
      return Response.json(
        {
          success: false,
          message: 'Account details verification failed',
          valid: false,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'An error occurred while verifying account details',
        valid: false,
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
