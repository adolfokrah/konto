import { PayloadRequest } from 'payload'

/**
 * GET /api/transactions/get-transaction?id=xxx
 *
 * Returns a single transaction with its related refunds from the refunds collection.
 */
export const getTransaction = async (req: PayloadRequest) => {
  try {
    if (!req.user) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url || '', 'http://localhost')
    const transactionId = url.searchParams.get('id')

    if (!transactionId) {
      return Response.json(
        { success: false, message: 'Transaction ID is required' },
        { status: 400 },
      )
    }

    // Fetch the transaction
    const transaction = await req.payload.findByID({
      collection: 'transactions',
      id: transactionId,
      depth: 2,
      overrideAccess: false,
      req,
    })

    if (!transaction) {
      return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    // Fetch related refunds from refunds collection
    const refundsResult = await req.payload.find({
      collection: 'refunds' as any,
      where: {
        linkedTransaction: { equals: transactionId },
      },
      depth: 0,
      overrideAccess: true,
    })

    const refunds = refundsResult.docs.map((refund: any) => ({
      id: refund.id,
      amount: refund.amount,
      accountName: refund.accountName,
      accountNumber: refund.accountNumber,
      mobileMoneyProvider: refund.mobileMoneyProvider,
      status: refund.status,
      transactionReference: refund.transactionReference,
      eganowFees: refund.eganowFees,
      hogapayRevenue: refund.hogapayRevenue,
      createdAt: refund.createdAt,
    }))

    return Response.json({
      ...transaction,
      refunds,
    })
  } catch (error: any) {
    console.error('[get-transaction] Error:', error.message)
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch transaction' },
      { status: 500 },
    )
  }
}
