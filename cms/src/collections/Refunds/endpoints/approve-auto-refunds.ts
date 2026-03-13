import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const approveAutoRefunds = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId } = req.data || {}

    if (!jarId) {
      return Response.json({ success: false, message: 'jarId is required' }, { status: 400 })
    }

    if (!req.user || (req.user as any).role !== 'admin') {
      return Response.json({ success: false, message: 'Admins only' }, { status: 403 })
    }

    // Find all awaiting_approval auto refunds for this jar
    const pending = await req.payload.find({
      collection: 'refunds',
      where: {
        and: [
          { jar: { equals: jarId } },
          { refundType: { equals: 'auto' } },
          { status: { equals: 'awaiting_approval' } },
        ],
      },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    if (!pending.docs.length) {
      return Response.json(
        { success: false, message: 'No pending auto refunds found for this jar' },
        { status: 404 },
      )
    }

    const now = new Date().toISOString()

    // Set each to in-progress and queue processing
    for (const refund of pending.docs) {
      await req.payload.update({
        collection: 'refunds',
        id: (refund as any).id,
        data: {
          status: 'in-progress',
          reviewedBy: req.user.id,
          reviewedAt: now,
        } as any,
        overrideAccess: true,
      })

      await req.payload.jobs.queue({
        task: 'process-refund' as any,
        input: { refundId: (refund as any).id },
        queue: 'refund',
      })
    }

    await req.payload.jobs.run({ queue: 'refund' })

    return Response.json({
      success: true,
      message: `${pending.docs.length} refund(s) approved and queued for processing.`,
      refundsQueued: pending.docs.length,
    })
  } catch (error: any) {
    console.error('Approve auto refunds error:', error)
    return Response.json(
      { success: false, message: 'Failed to approve auto refunds', error: error.message },
      { status: 500 },
    )
  }
}
