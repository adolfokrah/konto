import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

export const verifyAccountDetails = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    // `type`: 'mobile-money' (default) | 'bank'.
    // For momo: `bank` is the provider (mtn|telecel) and `phoneNumber` the wallet number.
    // For bank: `bank` is the Eganow bank paypartner code and `accountNumber` the bank account.
    const { phoneNumber, bank, type, accountNumber } = req.data || {}
    const isBank = type === 'bank'

    if (!bank) {
      return Response.json(
        { success: false, message: 'Bank/provider is required', valid: false },
        { status: 400 },
      )
    }

    let paypartnerCode: string
    let accountNoOrCardNoOrMSISDN: string
    const rawAccount = isBank ? accountNumber : phoneNumber

    if (!rawAccount) {
      return Response.json(
        {
          success: false,
          message: isBank ? 'Account number is required' : 'Phone number is required',
          valid: false,
        },
        { status: 400 },
      )
    }

    if (isBank) {
      // Bank code is passed through directly (e.g. STANBICGH).
      paypartnerCode = String(bank)
      accountNoOrCardNoOrMSISDN = String(accountNumber).replace(/\s+/g, '')
    } else {
      const providerMap: Record<string, string> = { mtn: 'MTNGH', telecel: 'TCELGH' }
      const mapped = providerMap[String(bank).toLowerCase()]
      if (!mapped) {
        return Response.json(
          { success: false, message: 'Unsupported mobile money provider', valid: false },
          { status: 400 },
        )
      }
      paypartnerCode = mapped
      // Format phone number to international format (233...)
      let formatted = String(phoneNumber).replace(/\s+/g, '')
      if (formatted.startsWith('0')) formatted = '233' + formatted.substring(1)
      else if (!formatted.startsWith('233')) formatted = '233' + formatted
      accountNoOrCardNoOrMSISDN = formatted
    }

    // Get token (automatically cached by Eganow class)
    await getEganow().getToken()

    // Name enquiry via Eganow. Bank name-enquiry requires the full 'GH0233' country
    // code (plain 'GH' returns isSuccess:false for banks); momo works with 'GH'.
    const kycResponse = await getEganow().verifyKYC({
      paypartnerCode,
      accountNoOrCardNoOrMSISDN,
      languageId: 'en',
      countryCode: isBank ? 'GH0233' : 'GH',
    })

    if (kycResponse.isSuccess && kycResponse.accountName) {
      return Response.json(
        {
          success: true,
          message: 'Account details verified successfully',
          data: {
            account_name: kycResponse.accountName,
            account_number: rawAccount,
          },
        },
        { status: 200 },
      )
    } else {
      return Response.json(
        {
          success: false,
          message: 'Account details verification failed',
          data: null,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error('[verify-account-details]', error.message)
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
