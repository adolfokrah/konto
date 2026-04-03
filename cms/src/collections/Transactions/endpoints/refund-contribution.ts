import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getCharges } from '@/utilities/getCharges'

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

    // Check for existing pending/in-progress/completed refund on this transaction
    const existingRefund = await req.payload.find({
      collection: 'refunds' as any,
      where: {
        linkedTransaction: { equals: transactionId },
        status: { in: ['pending', 'in-progress', 'completed'] },
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

    // Get jar ID
    const jarId = typeof originalTx.jar === 'string' ? originalTx.jar : (originalTx.jar as any)?.id

    // Refund base is amountDue (what the jar actually received after PSP fees)
    // Using amountContributed would mean refunding more than the jar holds
    const amountToRefund = (originalTx as any).amountDue ?? originalTx.amountContributed
    const refundCharges = await getCharges(req.payload, {
      amount: amountToRefund,
      type: 'refund',
    })

    // Create refund record with pending status (awaiting approval)
    await req.payload.create({
      collection: 'refunds' as any,
      data: {
        initiatedBy: req.user.id,
        amount: refundCharges.netAmount,
        processingFee: refundCharges.processingFee,
        initialAmount: refundCharges.initialAmount,
        accountNumber: originalTx.contributorPhoneNumber,
        accountName: originalTx.contributor || 'Contributor',
        mobileMoneyProvider: originalTx.mobileMoneyProvider,
        jar: jarId,
        linkedTransaction: transactionId,
        status: 'pending',
      },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Refund request created and awaiting approval',
    })
  } catch (error: any) {
    console.error('Refund endpoint error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to create refund request',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
