import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const cancelRefundBatch = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { refundId } = req.data || {}

    if (!refundId) {
      return Response.json({ success: false, message: 'refundId is required' }, { status: 400 })
    }

    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admins can cancel refund batches' },
        { status: 403 },
      )
    }

    const batch = await req.payload.findByID({
      collection: 'refunds' as any,
      id: refundId,
      depth: 0,
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
        {
          success: false,
          message: `Batch is already ${(batch as any).status} and cannot be cancelled`,
        },
        { status: 400 },
      )
    }

    const jarId =
      typeof (batch as any).jar === 'object' ? (batch as any).jar?.id : (batch as any).jar

    // Cancel the batch
    await req.payload.update({
      collection: 'refunds' as any,
      id: refundId,
      data: {
        status: 'cancelled',
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString(),
      } as any,
      overrideAccess: true,
    })

    // Unfreeze the jar
    if (jarId) {
      await req.payload.update({
        collection: 'jars',
        id: jarId,
        data: { status: 'open', freezeReason: null } as any,
        overrideAccess: true,
      })
    }

    return Response.json({
      success: true,
      message: 'Refund batch cancelled and jar unfrozen successfully.',
    })
  } catch (error: any) {
    console.error('Cancel refund batch error:', error)
    return Response.json(
      { success: false, message: 'Failed to cancel refund batch', error: error.message },
      { status: 500 },
    )
  }
}
