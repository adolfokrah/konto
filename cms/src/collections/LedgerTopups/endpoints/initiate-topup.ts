import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getEganow } from '@/utilities/initalise'

export const initiateTopup = async (req: PayloadRequest) => {
  try {
    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await addDataAndFileToRequest(req)
    const { amount, phoneNumber, provider } = req.data || {}

    if (!amount || !phoneNumber || !provider) {
      return Response.json(
        { success: false, message: 'amount, phoneNumber, and provider are required' },
        { status: 400 },
      )
    }

    if (Number(amount) <= 0) {
      return Response.json(
        { success: false, message: 'Amount must be greater than 0' },
        { status: 400 },
      )
    }

    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      telecel: 'TCELGH',
    }

    const paypartnerCode = providerMap[provider.toLowerCase()]
    if (!paypartnerCode) {
      return Response.json({ success: false, message: 'Unsupported provider' }, { status: 400 })
    }

    // Format phone number
    let formattedPhone = phoneNumber.replace(/\s+/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('233')) {
      formattedPhone = '233' + formattedPhone
    }

    // Create ledger record first
    const topup = await req.payload.create({
      collection: 'ledger-topups',
      data: {
        amount: Number(amount),
        phoneNumber: formattedPhone,
        provider,
        status: 'pending',
        initiatedBy: req.user.id,
      },
      overrideAccess: true,
    })

    // KYC lookup
    await getEganow().getToken()
    let accountName = 'Top-Up'
    try {
      const kycResult = await getEganow().verifyKYC({
        paypartnerCode,
        accountNoOrCardNoOrMSISDN: formattedPhone,
        languageId: 'en',
        countryCode: 'GH',
      })
      if (kycResult.accountName) {
        accountName = kycResult.accountName
      }
    } catch {
      // Continue without KYC name
    }

    // Update record with account name
    await req.payload.update({
      collection: 'ledger-topups',
      id: topup.id,
      data: { accountName },
      overrideAccess: true,
    })

    // Initiate collection via Eganow
    const collectionResult = await getEganow().collectMobileMoney({
      paypartnerCode,
      amount: String(amount),
      accountNoOrCardNoOrMSISDN: formattedPhone,
      accountName,
      transactionId: `topup-${topup.id}`,
      narration: 'Eganow collection balance top-up',
      transCurrencyIso: 'GHS',
      expiryDateMonth: 0,
      expiryDateYear: 0,
      cvv: '',
      languageId: 'en',
      callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/ledger-topups/eganow-topup-webhook`,
    })

    // Update record with Eganow reference
    await req.payload.update({
      collection: 'ledger-topups',
      id: topup.id,
      data: {
        transactionReference: collectionResult.eganowReferenceNo || '',
      },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Top-up initiated. Please approve the payment on your phone.',
      data: {
        topupId: topup.id,
        status: collectionResult.transactionStatus,
        reference: collectionResult.eganowReferenceNo,
      },
    })
  } catch (error: any) {
    console.error('Top-up initiation failed:', error.message)
    return Response.json(
      { success: false, message: error.message || 'Failed to initiate top-up' },
      { status: 500 },
    )
  }
}
