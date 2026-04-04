import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

// Maps legacy slug values to Paystack bank codes.
// If the value sent is already a Paystack code (e.g. 'MTN', 'VOD'), the map
// falls back to the uppercased value so both old and new clients work.
const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VOD',
  vodafone: 'VOD',
  airteltigo: 'ATL',
  atl: 'ATL',
}

export const verifyAccountDetails = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { accountNumber, bank, paymentMethod } = req.data || {}

    if (!accountNumber) {
      return Response.json(
        { success: false, message: 'Account number is required', valid: false },
        { status: 400 },
      )
    }

    if (!bank) {
      return Response.json(
        { success: false, message: 'Bank is required', valid: false },
        { status: 400 },
      )
    }

    const bankCode = bankCodeMap[bank.toLowerCase()] ?? bank.toUpperCase()

    // For mobile money, Paystack expects local format (0XXXXXXXXX)
    let resolvedAccountNumber = accountNumber.replace(/\s+/g, '')
    if (paymentMethod === 'mobile-money') {
      if (resolvedAccountNumber.startsWith('233')) {
        resolvedAccountNumber = '0' + resolvedAccountNumber.substring(3)
      } else if (!resolvedAccountNumber.startsWith('0')) {
        resolvedAccountNumber = '0' + resolvedAccountNumber
      }
    }

    const result = await getPaystack().resolveAccount(resolvedAccountNumber, bankCode)

    return Response.json(
      {
        success: true,
        message: 'Account details verified successfully',
        data: {
          account_name: result.account_name,
          account_number: accountNumber,
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
