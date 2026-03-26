import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const approveRefundBatch = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { refundId } = req.data || {}

    if (!refundId) {
      return Response.json({ success: false, message: 'refundId is required' }, { status: 400 })
    }

    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admins can approve refund batches' },
        { status: 403 },
      )
    }

    // Fetch the batch refund
    const batch = await req.payload.findByID({
      collection: 'refunds' as any,
      id: refundId,
      depth: 1,
      overrideAccess: true,
    })

    if (!batch) {
      return Response.json({ success: false, message: 'Refund batch not found' }, { status: 404 })
    }

    if ((batch as any).refundType !== 'auto-batch') {
      return Response.json(
        { success: false, message: 'This refund is not a batch' },
        { status: 400 },
      )
    }

    if ((batch as any).status !== 'pending_review') {
      return Response.json(
        { success: false, message: `Batch is already ${(batch as any).status}` },
        { status: 400 },
      )
    }

    const contributions: any[] = (batch as any).contributions || []
    if (!contributions.length) {
      return Response.json(
        { success: false, message: 'No contributions found on this batch' },
        { status: 400 },
      )
    }

    const jarId =
      typeof (batch as any).jar === 'object' ? (batch as any).jar?.id : (batch as any).jar

    const createdRefundIds: string[] = []

    // Create an individual refund record for each contribution
    for (const contribution of contributions) {
      const transactionId =
        typeof contribution.transaction === 'object'
          ? contribution.transaction?.id
          : contribution.transaction

      const newRefund = await req.payload.create({
        collection: 'refunds' as any,
        data: {
          refundType: 'auto',
          amount: Math.abs(contribution.amount),
          accountNumber: contribution.accountNumber || '',
          accountName: contribution.contributor || '',
          mobileMoneyProvider: contribution.mobileMoneyProvider || '',
          jar: jarId,
          linkedTransaction: transactionId,
          status: 'pending',
          batchRefund: refundId,
        } as any,
        overrideAccess: true,
        req,
      })

      // Immediately set to in-progress and queue processing
      await req.payload.update({
        collection: 'refunds' as any,
        id: newRefund.id,
        data: { status: 'in-progress' } as any,
        overrideAccess: true,
      })

      await req.payload.jobs.queue({
        task: 'process-refund' as any,
        input: { refundId: newRefund.id },
        queue: 'refund',
      })

      createdRefundIds.push(newRefund.id)
    }

    // Update batch: status → processing, set approvedBy, approvedAt, childRefunds
    await req.payload.update({
      collection: 'refunds' as any,
      id: refundId,
      data: {
        status: 'processing',
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString(),
        childRefunds: createdRefundIds.map((id) => ({ refund: id })),
      } as any,
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: `Batch approved. ${createdRefundIds.length} refund(s) queued for processing.`,
      refundsQueued: createdRefundIds.length,
    })
  } catch (error: any) {
    console.error('Approve refund batch error:', error)
    return Response.json(
      { success: false, message: 'Failed to approve refund batch', error: error.message },
      { status: 500 },
    )
  }
}
