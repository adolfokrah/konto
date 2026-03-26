import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getJarBalance } from '@/utilities/getJarBalance'

export const payoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId } = req.data || {}

    if (!jarId) {
      return Response.json({ success: false, message: 'Jar ID is required' }, { status: 400 })
    }

    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = req.user

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

    const creatorId = typeof jar.creator === 'string' ? jar.creator : jar.creator?.id
    if (creatorId !== user.id) {
      return Response.json(
        { success: false, message: 'Only the jar creator can request a payout' },
        { status: 403 },
      )
    }

    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      telecel: 'TCELGH',
    }

    if (!providerMap[user.bank.toLowerCase()]) {
      return Response.json(
        { success: false, message: 'Unsupported mobile money provider for Eganow payout' },
        { status: 400 },
      )
    }

    // Check for pending payout and calculate balance in parallel
    const [pendingPayout, { balance: netBalance }] = await Promise.all([
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

    // Find all accepted admin collectors in the jar
    const adminCollectors = ((jar.invitedCollectors as any[]) || []).filter(
      (ic: any) => ic.role === 'admin' && ic.status === 'accepted',
    )

    if (adminCollectors.length > 0) {
      // Cap requiredApprovals to the number of admin collectors
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

      // Jar has admin collectors — create transaction as awaiting-approval and skip Eganow
      const systemSettings = await req.payload.findGlobal({ slug: 'system-settings' })
      const transferFeePercentage = (systemSettings as any)?.transferFeePercentage || 1
      const transferFee = (netBalance * transferFeePercentage) / 100
      const expectedNetAmount = netBalance - transferFee

      const transaction = await req.payload.create({
        collection: 'transactions',
        data: {
          paymentStatus: 'awaiting-approval',
          paymentMethod: 'mobile-money',
          transactionReference: '',
          jar: jarId,
          mobileMoneyProvider: user.bank,
          amountContributed: -netBalance,
          collector: user.id,
          contributorPhoneNumber: user.accountNumber,
          contributor: user.accountHolder,
          type: 'payout',
          payoutFeePercentage: transferFeePercentage,
          payoutFeeAmount: transferFee,
          payoutNetAmount: expectedNetAmount,
        },
        overrideAccess: true,
      })

      // Send notification to each admin collector (no approval records created yet)
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

      return Response.json({
        success: true,
        message: 'Payout request submitted for approval',
      })
    }

    // No collector admin — create the payout transaction record first so any
    // subsequent request immediately sees a pending payout and is rejected,
    // eliminating the double-payout race window.
    const systemSettings = await req.payload.findGlobal({ slug: 'system-settings' })
    const transferFeePercentage = (systemSettings as any)?.transferFeePercentage || 1
    const transferFee = (netBalance * transferFeePercentage) / 100
    const expectedNetAmount = netBalance - transferFee

    const transaction = await req.payload.create({
      collection: 'transactions',
      data: {
        paymentStatus: 'pending',
        paymentMethod: 'mobile-money',
        transactionReference: '',
        jar: jarId,
        mobileMoneyProvider: user.bank,
        amountContributed: -netBalance,
        collector: user.id,
        contributorPhoneNumber: user.accountNumber,
        contributor: user.accountHolder,
        type: 'payout',
        payoutFeePercentage: transferFeePercentage,
        payoutFeeAmount: transferFee,
        payoutNetAmount: expectedNetAmount,
      },
      overrideAccess: true,
    })

    await req.payload.jobs.queue({
      task: 'process-payout' as any,
      input: { existingTransactionId: transaction.id },
      queue: 'payout',
    })

    return Response.json({
      success: true,
      message: 'Payout request is being processed',
    })
  } catch (error: any) {
    console.error('Payout queue error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to process payout request',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
