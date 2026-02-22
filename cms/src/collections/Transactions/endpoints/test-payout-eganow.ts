import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

export const testPayoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { amount, phoneNumber, provider, accountHolder, transactionId, narration, currency } =
      req.data || {}

    // Validate required fields
    if (!amount || !phoneNumber || !provider || !accountHolder) {
      return Response.json(
        {
          success: false,
          message: 'Amount, phoneNumber, provider, and accountHolder are required',
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

    const paypartner = providerMap[provider.toLowerCase()]
    if (!paypartner) {
      return Response.json(
        {
          success: false,
          message: 'Unsupported mobile money provider. Use: mtn, airteltigo, or telecel',
        },
        { status: 400 },
      )
    }

    // Format phone number to international format (233...)
    let formattedPhone = phoneNumber.replace(/\s+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    // Get token (automatically cached by Eganow class)
    await getEganow().getToken()

    // Prepare payout request data
    const payoutData = {
      paypartnerCode: paypartner,
      amount: String(amount),
      accountNoOrCardNoOrMSISDN: formattedPhone,
      accountName: accountHolder,
      transactionId: transactionId || `TEST-${Date.now()}`,
      narration: narration || `Test payout - ${Date.now()}`,
      transCurrencyIso: currency || 'GHS',
      expiryDateMonth: 0,
      expiryDateYear: 0,
      cvv: '',
      languageId: 'en',
      callback: `https://webhook.site/b5140341-ccf6-414a-a14b-4b4a5d252782`,
    }

    console.log('Test payout request data:', JSON.stringify(payoutData, null, 2))

    // Initiate payout via Eganow
    const payoutResult = await getEganow().payout(payoutData)

    // Return success response
    return Response.json({
      success: true,
      message: 'Test payout initiated successfully via Eganow',
      data: {
        transactionStatus: payoutResult.transactionStatus,
        eganowReferenceNo: payoutResult.eganowReferenceNo,
        message: payoutResult.message,
        requestData: payoutData,
      },
    })
  } catch (error: any) {
    console.error('Test Eganow payout error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to initiate test payout',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
