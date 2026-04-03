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

    // Update status to in-progress
    await req.payload.update({
      collection: 'refunds' as any,
      id: refundId,
      data: { status: 'in-progress' },
      overrideAccess: true,
    })

    // Queue the refund processing task — the autoRun runner picks it up within a minute
    await req.payload.jobs.queue({
      task: 'process-refund' as any,
      input: { refundId },
      queue: 'refund',
    })

    return Response.json({
      success: true,
      message: 'Refund approved and queued for processing',
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
