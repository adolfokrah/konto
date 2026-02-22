import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

// In-memory lock to prevent concurrent payouts for the same jar
const payoutLocks = new Set<string>()

export const payoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId } = req.data || {}

    // Validate required fields
    if (!jarId) {
      return Response.json(
        {
          success: false,
          message: 'Jar ID is required',
        },
        { status: 400 },
      )
    }

    // Prevent concurrent payouts for the same jar
    if (payoutLocks.has(jarId)) {
      return Response.json(
        {
          success: false,
          message: 'A payout is already being processed for this jar',
        },
        { status: 429 },
      )
    }
    payoutLocks.add(jarId)

    // Ensure user is authenticated
    if (!req.user) {
      return Response.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const user = req.user

    // Validate user's withdrawal account
    if (!user.bank || !user.accountNumber || !user.accountHolder) {
      return Response.json(
        {
          success: false,
          message:
            'Withdrawal account information is missing. Please set up your withdrawal account first.',
        },
        { status: 400 },
      )
    }

    // Fetch the jar to verify ownership and get currency
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
    })

    if (!jar) {
      return Response.json(
        {
          success: false,
          message: 'Jar not found',
        },
        { status: 404 },
      )
    }

    // Verify the logged-in user is the jar creator
    const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
    if (creatorId !== user.id) {
      return Response.json(
        {
          success: false,
          message: 'Only the jar creator can request a payout',
        },
        { status: 403 },
      )
    }

    // Check if there's already a pending payout for this jar
    const pendingPayout = await req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jarId },
        type: { equals: 'payout' },
        paymentStatus: { equals: 'pending' },
      },
      limit: 1,
    })

    if (pendingPayout.docs.length > 0) {
      return Response.json(
        {
          success: false,
          message: 'A payout is already pending for this jar',
        },
        { status: 400 },
      )
    }

    // Fetch all transactions for this jar to calculate payout amount
    const allTransactions = await req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jarId },
      },
      limit: 10000,
    })

    // Sum settled contributions (positive amounts)
    const settledContributionsSum = allTransactions.docs
      .filter(
        (tx) =>
          tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
      )
      .reduce((sum, tx) => sum + tx.amountContributed, 0)

    // Sum payouts (negative amounts) - includes pending, completed, and transferred
    const payoutsSum = allTransactions.docs
      .filter(
        (tx) =>
          tx.type === 'payout' &&
          (tx.paymentStatus === 'pending' ||
            tx.paymentStatus === 'completed' ||
            tx.paymentStatus === 'transferred'),
      )
      .reduce((sum, tx) => sum + tx.amountContributed, 0)

    // Net balance = settled contributions + payouts (payouts are negative)
    const netBalance = settledContributionsSum + payoutsSum

    if (netBalance <= 0) {
      return Response.json(
        {
          success: false,
          message: 'No balance available for payout',
        },
        { status: 400 },
      )
    }

    // Fetch system settings to get transfer fee
    const systemSettings = await req.payload.findGlobal({
      slug: 'system-settings',
    })

    const transferFeePercentage = systemSettings?.transferFeePercentage || 1
    const minimumPayoutAmount = systemSettings?.minimumPayoutAmount || 10

    // Check minimum payout amount
    if (netBalance < minimumPayoutAmount) {
      return Response.json(
        {
          success: false,
          message: `Minimum payout amount is ${jar.currency || 'GHS'} ${minimumPayoutAmount}`,
        },
        { status: 400 },
      )
    }

    // Calculate transfer fee for display/transparency purposes only
    // Eganow will handle the actual fee deduction on their end
    const transferFee = (netBalance * transferFeePercentage) / 100
    const expectedNetAmount = netBalance - transferFee

    // Map mobile money provider to Eganow paypartner code
    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      airteltigo: 'ATGH',
      telecel: 'TCELGH',
    }

    const paypartner = providerMap[user.bank.toLowerCase()]
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
    let phoneNumber = user.accountNumber.replace(/\s+/g, '')
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '233' + phoneNumber.substring(1)
    } else if (!phoneNumber.startsWith('233')) {
      phoneNumber = '233' + phoneNumber
    }

    // Get token (automatically cached by Eganow class)
    await getEganow().getToken()

    // Create payout transaction record first (negative amount)
    // Store the full amount sent to Eganow (they will deduct the fee on their end)
    const transaction = await req.payload.create({
      collection: 'transactions',
      data: {
        paymentStatus: 'pending',
        paymentMethod: 'mobile-money',
        transactionReference: '', // Will be updated after Eganow call
        jar: jarId,
        mobileMoneyProvider: user.bank,
        amountContributed: -netBalance, // Full amount sent to Eganow
        collector: user.id,
        contributorPhoneNumber: user.accountNumber,
        contributor: user.accountHolder,
        type: 'payout',
        // Store fee information for display purposes (Eganow handles actual deduction)
        payoutFeePercentage: transferFeePercentage,
        payoutFeeAmount: transferFee,
        payoutNetAmount: expectedNetAmount,
      },
    })

    console.log(`Payout transaction created with ID: ${transaction.id}`)

    // Prepare payout request data using the transaction ID
    // Send FULL amount to Eganow - they will deduct their fee on their end
    const payoutData = {
      paypartnerCode: paypartner,
      amount: String(netBalance.toFixed(2)), // Full amount - Eganow deducts fee
      accountNoOrCardNoOrMSISDN: phoneNumber,
      accountName: user.accountHolder,
      transactionId: `payout-${transaction.id}`,
      narration: `Payout for jar ${jar.name}`,
      transCurrencyIso: jar.currency || 'GHS',
      expiryDateMonth: 0,
      expiryDateYear: 0,
      cvv: '',
      languageId: 'en',
      callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/transactions/eganow-payout-webhook`,
    }

    console.log('Payout request data:', JSON.stringify(payoutData, null, 2))

    // Initiate payout via Eganow
    const payoutResult = await getEganow().payout(payoutData)

    console.log(
      `Payout initiated - eganowReferenceNo: ${payoutResult.eganowReferenceNo}, transactionId: ${payoutData.transactionId}`,
    )

    // Update transaction with Eganow reference number
    await req.payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: {
        transactionReference: payoutResult.eganowReferenceNo,
      },
    })

    console.log(
      `Payout transaction ${transaction.id} updated with reference: ${payoutResult.eganowReferenceNo}`,
    )

    payoutLocks.delete(jarId)

    // Return success response
    return Response.json({
      success: true,
      message: 'Payout initiated successfully via Eganow',
      data: {
        grossAmount: netBalance,
        transferFee: transferFee,
        netAmount: expectedNetAmount, // Expected amount user will receive (for display)
        currency: jar.currency || 'GHS',
        transactionStatus: payoutResult.transactionStatus,
        eganowReferenceNo: payoutResult.eganowReferenceNo,
        message: payoutResult.message,
      },
    })
  } catch (error: any) {
    const catchJarId = req.data?.jarId
    if (catchJarId) payoutLocks.delete(catchJarId)
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
