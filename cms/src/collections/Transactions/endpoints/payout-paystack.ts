import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getJarBalance } from '@/utilities/getJarBalance'
import { getCharges } from '@/utilities/getCharges'

const bankCodeMap: Record<string, string> = {
  mtn: 'MTN',
  telecel: 'VDF',
  vodafone: 'VDF',
  airteltigo: 'ATL',
}

export const payoutPaystack = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId, payoutType = 'mobile-money' } = req.data || {}
    const isBank = payoutType === 'bank'

    if (!jarId) {
      return Response.json({ success: false, message: 'Jar ID is required' }, { status: 400 })
    }

    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = req.user as any

    // Validate withdrawal account
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

    if (!bankCodeMap[user.bank.toLowerCase()]) {
      return Response.json(
        { success: false, message: 'Unsupported mobile money provider' },
        { status: 400 },
      )
    }

    // Fetch jar and verify ownership
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 1,
      overrideAccess: true,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    if (jar.status === 'frozen') {
      return Response.json(
        { success: false, message: 'This jar is currently frozen and payouts are not allowed' },
        { status: 403 },
      )
    }

    const creatorId = typeof jar.creator === 'string' ? jar.creator : (jar.creator as any)?.id
    if (creatorId !== user.id) {
      return Response.json(
        { success: false, message: 'Only the jar creator can request a payout' },
        { status: 403 },
      )
    }

    // Fetch system settings and check pending payout + balance in parallel
    const [settings, pendingPayout, { balance: netBalance }] = await Promise.all([
      req.payload.findGlobal({ slug: 'system-settings', overrideAccess: true }),
      req.payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { in: ['pending', 'awaiting-approval'] },
        },
        limit: 1,
        overrideAccess: true,
      }),
      getJarBalance(req.payload, jarId),
    ])

    const creatorCountry =
      typeof jar.creator === 'object' ? (jar.creator as any)?.country : undefined

    const payoutCharges = await getCharges(req.payload, {
      amount: netBalance,
      type: 'payout',
      paymentMethod: isBank ? 'bank' : 'mobile-money',
      country: creatorCountry,
    })
    const feeAmount = payoutCharges.processingFee
    const netAmount = payoutCharges.netAmount
    const transferFeePercentage =
      netBalance > 0 ? Math.round((feeAmount / netBalance) * 100 * 100) / 100 : 0

    if (pendingPayout.docs.length > 0) {
      return Response.json(
        { success: false, message: 'A payout is already pending for this jar' },
        { status: 400 },
      )
    }

    if (netBalance <= 0) {
      return Response.json(
        { success: false, message: 'No balance available for payout' },
        { status: 400 },
      )
    }

    const minimumPayoutAmount = (settings as any)?.minimumPayoutAmount ?? 10
    if (netBalance < minimumPayoutAmount) {
      return Response.json(
        {
          success: false,
          message: `Minimum payout amount is GHS ${minimumPayoutAmount.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Find all accepted admin collectors in the jar
    const adminCollectors = ((jar.invitedCollectors as any[]) || []).filter(
      (ic: any) => ic.role === 'admin' && ic.status === 'accepted',
    )

    if (adminCollectors.length > 0) {
      // Cap requiredApprovals to number of admin collectors
      const requiredApprovals = Math.min(
        (jar as any).requiredApprovals || 1,
        adminCollectors.length,
      )
      if (requiredApprovals !== ((jar as any).requiredApprovals || 1)) {
        await req.payload.update({
          collection: 'jars',
          id: jarId,
          data: { requiredApprovals } as any,
          overrideAccess: true,
        })
      }

      const transaction = await req.payload.create({
        collection: 'transactions',
        data: {
          paymentStatus: 'awaiting-approval',
          paymentMethod: isBank ? 'bank' : 'mobile-money',
          transactionReference: '',
          jar: jarId,
          mobileMoneyProvider: isBank ? undefined : user.bank,
          amountContributed: -netBalance,
          collector: user.id,
          contributorPhoneNumber: user.accountNumber,
          contributor: user.accountHolder,
          type: 'payout',
          payoutFeePercentage: transferFeePercentage,
          payoutFeeAmount: feeAmount,
          payoutNetAmount: netAmount,
          chargesBreakdown: {
            platformCharge: feeAmount,
            amountPaidByContributor: netBalance,
            hogapayRevenue: payoutCharges.hogapayRevenue,
            eganowFees: payoutCharges.eganowFees,
            discountPercent: 0,
            discountAmount: 0,
            amountToSendToEganow: netAmount,
            collectionFeePercent: transferFeePercentage,
          },
        },
        overrideAccess: true,
      })

      const amount = Math.abs(netBalance).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

      await Promise.all(
        adminCollectors.map(async (ic: any) => {
          const collectorId = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
          if (collectorId) {
            await req.payload.create({
              collection: 'notifications',
              data: {
                type: 'payout-approval',
                status: 'unread',
                title: 'Payout Approval Requested',
                message: `A payout of GHS ${amount} from ${jar.name || 'a jar'} requires your approval.`,
                user: collectorId,
                data: {
                  jarId,
                  transactionId: transaction.id,
                  amount: netBalance,
                  type: 'payout-approval',
                },
              },
              overrideAccess: true,
            })
          }
        }),
      )

      return Response.json({ success: true, message: 'Payout request submitted for approval' })
    }

    // No admin collectors — create transaction and queue payout job
    const transaction = await req.payload.create({
      collection: 'transactions',
      data: {
        paymentStatus: 'pending',
        paymentMethod: isBank ? 'bank' : 'mobile-money',
        transactionReference: '',
        jar: jarId,
        mobileMoneyProvider: isBank ? undefined : user.bank,
        amountContributed: -netBalance,
        collector: user.id,
        contributorPhoneNumber: user.accountNumber,
        contributor: user.accountHolder,
        type: 'payout',
        payoutFeePercentage: transferFeePercentage,
        payoutFeeAmount: feeAmount,
        payoutNetAmount: netAmount,
        chargesBreakdown: {
          platformCharge: feeAmount,
          amountPaidByContributor: netBalance,
          hogapayRevenue: feeAmount,
          eganowFees: 0,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: netAmount,
          collectionFeePercent: transferFeePercentage,
        },
      },
      overrideAccess: true,
    })

    await req.payload.jobs.queue({
      task: 'process-payout-paystack' as any,
      input: { existingTransactionId: transaction.id },
      queue: 'payout-paystack',
    })

    return Response.json({ success: true, message: 'Payout is being processed' })
  } catch (error: any) {
    console.error('payoutPaystack error:', error)
    return Response.json(
      { success: false, message: error.message || 'Failed to process payout request' },
      { status: 500 },
    )
  }
}
