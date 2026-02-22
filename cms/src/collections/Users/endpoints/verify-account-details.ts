import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

export const verifyAccountDetails = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { phoneNumber, bank } = req.data || {}

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

    // Map mobile money provider to Eganow paypartner code
    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      airteltigo: 'ATGH',
      telecel: 'TCELGH',
    }

    const paypartnerCode = providerMap[bank.toLowerCase()]
    if (!paypartnerCode) {
      return Response.json(
        {
          success: false,
          message: 'Unsupported mobile money provider',
          valid: false,
        },
        { status: 400 },
      )
    }

    // Format phone number to international format (233...)
    let formattedPhoneNumber = phoneNumber.replace(/\s+/g, '')
    if (formattedPhoneNumber.startsWith('0')) {
      formattedPhoneNumber = '233' + formattedPhoneNumber.substring(1)
    } else if (!formattedPhoneNumber.startsWith('233')) {
      formattedPhoneNumber = '233' + formattedPhoneNumber
    }

    // Get token (automatically cached by Eganow class)
    await getEganow().getToken()

    // Verify KYC using Eganow
    const kycResponse = await getEganow().verifyKYC({
      paypartnerCode,
      accountNoOrCardNoOrMSISDN: formattedPhoneNumber,
      languageId: 'en',
      countryCode: 'GH',
    })

    if (kycResponse.isSuccess && kycResponse.accountName) {
      return Response.json(
        {
          success: true,
          message: 'Account details verified successfully',
          data: {
            account_name: kycResponse.accountName,
            account_number: phoneNumber,
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
