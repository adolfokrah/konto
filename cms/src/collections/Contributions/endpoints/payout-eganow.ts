import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { eganow } from '@/utilities/initalise'

export const payoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { contributionId } = req.data || {}

    // Validate required fields
    if (!contributionId) {
      return Response.json(
        {
          success: false,
          message: 'Contribution ID is required',
        },
        { status: 400 },
      )
    }

    // Fetch the contribution with full depth to get jar and creator details
    const foundContribution = await req.payload.findByID({
      collection: 'contributions',
      id: contributionId,
      depth: 3,
    })

    if (!foundContribution) {
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
    }

    // Check if contribution has already been transferred
    if (foundContribution.isTransferred) {
      return Response.json(
        {
          success: false,
          message: 'Contribution has already been transferred',
        },
        { status: 400 },
      )
    }

    // Check if there's already a pending transfer for this contribution
    const pendingTransfer = await req.payload.find({
      collection: 'contributions',
      where: {
        linkedContribution: {
          equals: contributionId,
        },
        paymentStatus: {
          equals: 'pending',
        },
      },
      limit: 1,
    })

    if (pendingTransfer.docs.length > 0) {
      return Response.json(
        {
          success: false,
          message: 'Pending transfer already exists',
        },
        { status: 400 },
      )
    }

    // Get the jar creator (recipient)
    const creator = await req.payload.findByID({
      collection: 'users',
      id:
        typeof foundContribution.jar === 'string'
          ? foundContribution.jar
          : typeof foundContribution.jar.creator === 'string'
            ? foundContribution.jar.creator
            : foundContribution.jar.creator.id,
    })

    if (!creator) {
      return Response.json(
        {
          success: false,
          message: 'Creator not found',
        },
        { status: 404 },
      )
    }

    // Validate creator's bank information
    if (!creator.bank || !creator.accountNumber || !creator.accountHolder) {
      return Response.json(
        {
          success: false,
          message: 'Creator bank information is missing',
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

    const paypartner = providerMap[creator.bank.toLowerCase()]
    if (!paypartner) {
      return Response.json(
        {
          success: false,
          message: 'Unsupported mobile money provider for Eganow payout',
        },
        { status: 400 },
      )
    }

    // Format phone number to international format (233...)
    let phoneNumber = creator.accountNumber.replace(/\s+/g, '')
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '233' + phoneNumber.substring(1)
    } else if (!phoneNumber.startsWith('233')) {
      phoneNumber = '233' + phoneNumber
    }

    // Get token (automatically cached by Eganow class)
    await eganow.getToken()

    // Prepare payout request data (same structure as collection)
    const payoutData = {
      paypartnerCode: paypartner,
      amount: String(Math.abs(foundContribution.amountContributed)), // Amount as string
      accountNoOrCardNoOrMSISDN: phoneNumber,
      accountName: creator.accountHolder,
      transactionId: contributionId, // Use contribution ID as transaction reference
      narration: `Payout for contribution ${contributionId}`,
      transCurrencyIso:
        typeof foundContribution.jar === 'string' ? 'GHS' : foundContribution.jar.currency,
      expiryDateMonth: 0,
      expiryDateYear: 0,
      cvv: '',
      languageId: 'en',
      callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/contributions/eganow-payout-webhook`,
    }

    console.log('Payout request data:', JSON.stringify(payoutData, null, 2))

    // Initiate payout via Eganow
    const payoutResult = await eganow.payout(payoutData)

    // Create transfer contribution record
    await req.payload.create({
      collection: 'contributions',
      data: {
        paymentStatus: 'pending',
        paymentMethod: 'mobile-money',
        linkedContribution: contributionId,
        transactionReference: payoutResult.eganowReferenceNo,
        jar: foundContribution.jar,
        mobileMoneyProvider: creator.bank,
        amountContributed: -Math.abs(foundContribution.amountContributed), // Negative for payout
        collector: foundContribution.collector,
        contributorPhoneNumber: creator.accountNumber,
        contributor:
          typeof foundContribution.collector === 'string'
            ? foundContribution.collector
            : foundContribution.collector?.fullName || 'Anonymous',
        type: 'transfer',
      },
    })

    // Do NOT mark as transferred yet - will be marked when payout completes successfully

    // Return success response
    return Response.json({
      success: true,
      message: 'Payout initiated successfully via Eganow',
      data: {
        transactionStatus: payoutResult.transactionStatus,
        eganowReferenceNo: payoutResult.eganowReferenceNo,
        message: payoutResult.message,
      },
    })
  } catch (error: any) {
    console.error('Eganow payout error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to initiate payout',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
