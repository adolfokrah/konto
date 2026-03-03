import type { PayloadRequest } from 'payload'

export const submitReport = async (req: PayloadRequest) => {
  try {
    const body = (req as any).data || {}
    const { jarId, message } = body

    if (!jarId || typeof jarId !== 'string') {
      return Response.json({ success: false, message: 'jarId is required' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ success: false, message: 'message is required' }, { status: 400 })
    }

    // Verify the jar exists
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    const reportData = {
      jar: jarId,
      message: message.trim(),
      ...(req.user ? { user: req.user.id } : {}),
    }

    await req.payload.create({
      collection: 'jar-reports',
      data: reportData,
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Report submitted successfully',
    })
  } catch (error) {
    req.payload.logger.error(`submitReport error: ${(error as Error).message}`)
    return Response.json({ success: false, message: 'Failed to submit report' }, { status: 500 })
  }
}
