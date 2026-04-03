import { PayloadRequest } from 'payload'

/**
 * GET /api/transactions/payment-status?transactionId=xxx
 *
 * Lightweight read-only status check for the mobile WebView polling.
 * Only reads from DB — never calls Paystack API, never updates any record.
 */
export const paymentStatus = async (req: PayloadRequest) => {
  try {
    const transactionId = req.query?.transactionId as string

    if (!transactionId) {
      return Response.json(
        { success: false, message: 'transactionId is required' },
        { status: 400 },
      )
    }

    const transactions = await req.payload.find({
      collection: 'transactions',
      where: { transactionReference: { equals: transactionId } },
      limit: 1,
      overrideAccess: true,
    })

    const transaction = transactions.docs[0] as any
    if (!transaction) {
      return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: { status: transaction.paymentStatus as string },
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch status' },
      { status: 500 },
    )
  }
}
