import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const refundContribution = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { transactionId } = req.data || {}

    if (!transactionId) {
      return Response.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 },
      )
    }

    // Admin-only check
    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admins can issue refunds' },
        { status: 403 },
      )
    }

    // Fetch the original transaction
    const originalTx = await req.payload.findByID({
      collection: 'transactions',
      id: transactionId,
      depth: 1,
      overrideAccess: true,
    })

    if (!originalTx) {
      return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    // Validate: must be an unsettled mobile-money contribution with completed payment
    if (originalTx.type !== 'contribution') {
      return Response.json(
        { success: false, message: 'Only contributions can be refunded' },
        { status: 400 },
      )
    }

    if (originalTx.paymentStatus !== 'completed') {
      return Response.json(
        { success: false, message: 'Only completed transactions can be refunded' },
        { status: 400 },
      )
    }

    if (originalTx.paymentMethod !== 'mobile-money') {
      return Response.json(
        { success: false, message: 'Only mobile-money contributions can be refunded' },
        { status: 400 },
      )
    }

    if (originalTx.isSettled === true) {
      return Response.json(
        { success: false, message: 'Settled contributions cannot be refunded' },
        { status: 400 },
      )
    }

    // Check contributor phone number and provider exist
    if (!originalTx.contributorPhoneNumber || !originalTx.mobileMoneyProvider) {
      return Response.json(
        { success: false, message: 'Missing contributor phone number or mobile money provider' },
        { status: 400 },
      )
    }

    // Map provider early to fail fast
    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      telecel: 'TCELGH',
    }

    if (!providerMap[originalTx.mobileMoneyProvider.toLowerCase()]) {
      return Response.json(
        { success: false, message: 'Unsupported mobile money provider for refund' },
        { status: 400 },
      )
    }

    // Check for existing pending/completed refund on this transaction
    const existingRefund = await req.payload.find({
      collection: 'transactions',
      where: {
        linkedTransaction: { equals: transactionId },
        type: { equals: 'refund' },
        paymentStatus: { in: ['pending', 'completed'] },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingRefund.docs.length > 0) {
      return Response.json(
        { success: false, message: 'A refund has already been issued for this transaction' },
        { status: 400 },
      )
    }

    // Queue the refund task
    const jarId = typeof originalTx.jar === 'string' ? originalTx.jar : (originalTx.jar as any)?.id

    await req.payload.jobs.queue({
      task: 'process-refund' as any,
      input: {
        originalTransactionId: transactionId,
        jarId,
        contributorPhone: originalTx.contributorPhoneNumber,
        contributorName: originalTx.contributor || 'Contributor',
        mobileMoneyProvider: originalTx.mobileMoneyProvider,
        amount: String(originalTx.amountContributed),
      },
      queue: 'refund',
    })

    // Process the queue immediately
    await req.payload.jobs.run({ queue: 'refund' })

    return Response.json({
      success: true,
      message: 'Refund request is being processed',
    })
  } catch (error: any) {
    console.error('Refund endpoint error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to process refund request',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
