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

    // Fetch payout approvals and jar info for payout transactions
    let approvals: any[] = []
    let requiredApprovals = 1
    if ((transaction as any).type === 'payout') {
      const jarId =
        typeof (transaction as any).jar === 'object'
          ? (transaction as any).jar?.id
          : (transaction as any).jar

      const [approvalsResult, jar] = await Promise.all([
        req.payload.find({
          collection: 'payout-approvals' as any,
          where: {
            linkedTransaction: { equals: transactionId },
          },
          depth: 1,
          overrideAccess: true,
        }),
        jarId
          ? req.payload.findByID({
              collection: 'jars',
              id: jarId,
              depth: 0,
              overrideAccess: true,
            })
          : null,
      ])

      requiredApprovals = (jar as any)?.requiredApprovals || 1

      approvals = approvalsResult.docs.map((approval: any) => ({
        id: approval.id,
        status: approval.status,
        requestedBy:
          typeof approval.requestedBy === 'object'
            ? {
                id: approval.requestedBy?.id,
                fullName: approval.requestedBy?.fullName || 'Unknown',
              }
            : approval.requestedBy,
        actionBy:
          typeof approval.actionBy === 'object'
            ? {
                id: approval.actionBy?.id,
                fullName: approval.actionBy?.fullName || 'Unknown',
              }
            : approval.actionBy,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
      }))
    }

    return Response.json({
      ...transaction,
      refunds,
      approvals,
      requiredApprovals,
    })
  } catch (error: any) {
    console.error('[get-transaction] Error:', error.message)
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch transaction' },
      { status: 500 },
    )
  }
}
