import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const rejectAutoRefunds = async (req: PayloadRequest) => {
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

    // Reject all
    for (const refund of pending.docs) {
      await req.payload.update({
        collection: 'refunds',
        id: (refund as any).id,
        data: {
          status: 'rejected',
          reviewedBy: req.user.id,
          reviewedAt: now,
        } as any,
        overrideAccess: true,
      })
    }

    // Unfreeze the jar
    await req.payload.update({
      collection: 'jars',
      id: jarId,
      data: { status: 'open', freezeReason: null } as any,
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: `${pending.docs.length} refund(s) rejected. Jar unfrozen.`,
    })
  } catch (error: any) {
    console.error('Reject auto refunds error:', error)
    return Response.json(
      { success: false, message: 'Failed to reject auto refunds', error: error.message },
      { status: 500 },
    )
  }
}
