import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VDF',
  vodafone: 'VDF',
  airteltigo: 'ATL',
}

export const verifyAccountDetails = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { phoneNumber, bank } = req.data || {}

    if (!phoneNumber) {
      return Response.json(
        { success: false, message: 'Phone number is required', valid: false },
        { status: 400 },
      )
    }

    if (!bank) {
      return Response.json(
        { success: false, message: 'Bank is required', valid: false },
        { status: 400 },
      )
    }

    const bankCode = bankCodeMap[bank.toLowerCase()]
    if (!bankCode) {
      return Response.json(
        { success: false, message: 'Unsupported mobile money provider', valid: false },
        { status: 400 },
      )
    }

    // Paystack expects local format (0XXXXXXXXX) for Ghana mobile money
    let formattedPhone = phoneNumber.replace(/\s+/g, '')
    if (formattedPhone.startsWith('233')) {
      formattedPhone = '0' + formattedPhone.substring(3)
    } else if (!formattedPhone.startsWith('0')) {
      formattedPhone = '0' + formattedPhone
    }

    const result = await getPaystack().resolveAccount(formattedPhone, bankCode)

    return Response.json(
      {
        success: true,
        message: 'Account details verified successfully',
        data: {
          account_name: result.account_name,
          account_number: phoneNumber,
        },
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('[verify-account-details]', error.message)

    // Paystack returns 422 when account number is not found
    const notFound =
      error.message?.includes('422') || error.message?.toLowerCase().includes('could not resolve')

    return Response.json(
      {
        success: false,
        message: notFound
          ? 'Account details verification failed'
          : 'An error occurred while verifying account details',
        valid: false,
        data: null,
      },
      { status: notFound ? 400 : 500 },
    )
  }
}
