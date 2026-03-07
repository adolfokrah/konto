import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const rejectRefund = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { refundId } = req.data || {}

    if (!refundId) {
      return Response.json({ success: false, message: 'Refund ID is required' }, { status: 400 })
    }

    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json(
        { success: false, message: 'Only admins can reject refunds' },
        { status: 403 },
      )
    }

    const refund = await req.payload.findByID({
      collection: 'refunds' as any,
      id: refundId,
      depth: 0,
      overrideAccess: true,
    })

    if (!refund) {
      return Response.json({ success: false, message: 'Refund not found' }, { status: 404 })
    }

    // Prevent the initiator from rejecting their own refund
    const initiatorId =
      typeof refund.initiatedBy === 'object' ? (refund.initiatedBy as any)?.id : refund.initiatedBy
    if (initiatorId && initiatorId === req.user!.id) {
      return Response.json(
        {
          success: false,
          message: 'You cannot reject a refund you initiated. A different admin must reject it.',
        },
        { status: 403 },
      )
    }

    if (refund.status !== 'pending') {
      return Response.json(
        { success: false, message: `Refund is already ${refund.status}` },
        { status: 400 },
      )
    }

    await req.payload.update({
      collection: 'refunds' as any,
      id: refundId,
      data: { status: 'failed' },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Refund rejected',
    })
  } catch (error: any) {
    console.error('Reject refund error:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to reject refund',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
