import { PayloadRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

/**
 * GET /api/transactions/verify-paystack-payment?reference=xxx
 *
 * Called by the /pay/callback page after Paystack redirects back.
 * Verifies the transaction with Paystack and updates the record.
 */
export const verifyPaystackPayment = async (req: PayloadRequest) => {
  try {
    const reference = req.query?.reference as string

    if (!reference) {
      return Response.json({ success: false, message: 'Reference is required' }, { status: 400 })
    }

    // Find the transaction by reference
    const transactions = await req.payload.find({
      collection: 'transactions',
      where: { transactionReference: { equals: reference } },
      limit: 1,
      overrideAccess: true,
    })

    const transaction = transactions.docs[0] as any

    if (!transaction) {
      return Response.json({ success: false, message: 'Transaction not found' }, { status: 404 })
    }

    const jarId = typeof transaction.jar === 'object' ? transaction.jar?.id : transaction.jar
    const collectorId =
      typeof transaction.collector === 'object' ? transaction.collector?.id : transaction.collector

    // Already completed — return stored details without re-verifying
    if (transaction.paymentStatus === 'completed') {
      const jarName = typeof transaction.jar === 'object' ? transaction.jar?.name : ''
      return Response.json({
        success: true,
        data: {
          status: 'completed',
          transactionId: transaction.id,
          amount: transaction.amountContributed,
          contributorName: transaction.contributor,
          jarId,
          jarName,
        },
      })
    }

    if (transaction.paymentStatus === 'failed') {
      return Response.json(
        { success: false, message: 'Payment failed', data: { status: 'failed' } },
        { status: 400 },
      )
    }

    // Verify with Paystack
    const paystack = getPaystack()
    const verification = await paystack.verifyTransaction(reference)

    const newStatus =
      verification.status === 'success'
        ? 'completed'
        : verification.status === 'failed' || verification.status === 'abandoned'
          ? 'failed'
          : 'pending'

    await req.payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: {
        paymentStatus: newStatus,
        webhookResponse: verification as any,
        ...(jarId ? { jar: jarId } : {}),
        ...(collectorId ? { collector: collectorId } : {}),
      },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    if (newStatus === 'completed') {
      const jarName = typeof transaction.jar === 'object' ? transaction.jar?.name : ''
      return Response.json({
        success: true,
        data: {
          status: 'completed',
          transactionId: transaction.id,
          amount: transaction.amountContributed,
          contributorName: transaction.contributor,
          jarId,
          jarName,
        },
      })
    }

    if (newStatus === 'failed') {
      return Response.json(
        { success: false, message: 'Payment was not successful', data: { status: 'failed' } },
        { status: 400 },
      )
    }

    return Response.json(
      { success: false, message: 'Payment is still pending', data: { status: 'pending' } },
      { status: 202 },
    )
  } catch (error: any) {
    console.error('verifyPaystackPayment error:', error)
    return Response.json(
      { success: false, message: error.message || 'Failed to verify payment' },
      { status: 500 },
    )
  }
}
