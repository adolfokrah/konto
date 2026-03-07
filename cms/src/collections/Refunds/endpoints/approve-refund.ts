import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const approveRefund = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { refundId } = req.data || {}

    if (!refundId) {
      return Response.json({ success: false, message: 'Refund ID is required' }, { status: 400 })
    }

    // Admin-only check
    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admins can approve refunds' },
        { status: 403 },
      )
    }

    // Fetch the refund
    const refund = await req.payload.findByID({
      collection: 'refunds' as any,
      id: refundId,
      depth: 0,
      overrideAccess: true,
    })

    if (!refund) {
      return Response.json({ success: false, message: 'Refund not found' }, { status: 404 })
    }

    if (refund.status !== 'pending') {
      return Response.json(
        { success: false, message: `Refund is already ${refund.status}` },
        { status: 400 },
      )
    }

    // Prevent the initiator from approving their own refund
    const initiatorId =
      typeof refund.initiatedBy === 'object' ? (refund.initiatedBy as any)?.id : refund.initiatedBy
    if (initiatorId && initiatorId === req.user!.id) {
      return Response.json(
        {
          success: false,
          message: 'You cannot approve a refund you initiated. A different admin must approve it.',
        },
        { status: 403 },
      )
    }

    // Update status to in-progress
    await req.payload.update({
      collection: 'refunds' as any,
      id: refundId,
      data: { status: 'in-progress' },
      overrideAccess: true,
    })

    // Queue the refund processing task
    await req.payload.jobs.queue({
      task: 'process-refund' as any,
      input: {
        refundId,
      },
      queue: 'refund',
    })

    // Process the queue immediately
    await req.payload.jobs.run({ queue: 'refund' })

    return Response.json({
      success: true,
      message: 'Refund approved and processing started',
    })
  } catch (error: any) {
    console.error('Approve refund error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to approve refund',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
