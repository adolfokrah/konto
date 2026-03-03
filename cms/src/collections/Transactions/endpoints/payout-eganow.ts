import { addDataAndFileToRequest, PayloadRequest } from 'payload'

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

    // Check for pending payout and calculate balance in parallel
    const [pendingPayout, allTransactions] = await Promise.all([
      req.payload.find({
        collection: 'transactions',
        where: {
          jar: { equals: jarId },
          type: { equals: 'payout' },
          paymentStatus: { equals: 'pending' },
        },
        limit: 1,
        overrideAccess: true,
      }),
      req.payload.find({
        collection: 'transactions',
        where: { jar: { equals: jarId } },
        limit: 10000,
        select: { amountContributed: true, type: true, isSettled: true, paymentStatus: true },
        overrideAccess: true,
      }),
    ])

    if (pendingPayout.docs.length > 0) {
      return Response.json(
        { success: false, message: 'A payout is already pending for this jar' },
        { status: 400 },
      )
    }

    // Calculate balance
    const settledSum = allTransactions.docs
      .filter(
        (tx: any) =>
          tx.type === 'contribution' && tx.paymentStatus === 'completed' && tx.isSettled === true,
      )
      .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

    const payoutsSum = allTransactions.docs
      .filter(
        (tx: any) =>
          (tx.type === 'payout' || tx.type === 'refund') &&
          (tx.paymentStatus === 'pending' || tx.paymentStatus === 'completed'),
      )
      .reduce((sum: number, tx: any) => sum + tx.amountContributed, 0)

    const netBalance = settledSum + payoutsSum

    if (netBalance <= 0) {
      return Response.json(
        { success: false, message: 'No balance available for payout' },
        { status: 400 },
      )
    }

    // Map provider early to fail fast
    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      airteltigo: 'ATGH',
      telecel: 'TCELGH',
    }

    if (!providerMap[user.bank.toLowerCase()]) {
      return Response.json(
        { success: false, message: 'Unsupported mobile money provider for Eganow payout' },
        { status: 400 },
      )
    }

    // All validations passed — queue the payout job
    // The queue processes sequentially, preventing double payouts
    await req.payload.jobs.queue({
      task: 'process-payout' as any,
      input: {
        jarId,
        userId: user.id,
        userBank: user.bank,
        userAccountNumber: user.accountNumber,
        userAccountHolder: user.accountHolder,
      },
      queue: 'payout',
    })

    // Process the queue immediately
    await req.payload.jobs.run({ queue: 'payout' })

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
