import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const leaveJar = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    if (!req.user) {
      return Response.json({ success: false, message: 'User not authenticated' }, { status: 401 })
    }

    const { jarId } = req.data || {}

    if (!jarId) {
      return Response.json({ success: false, message: 'jarId is required' }, { status: 400 })
    }

    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    const userId = req.user.id as string

    // Check that the user is an accepted collector (not the creator)
    const isAcceptedCollector = jar.invitedCollectors?.some((collector) => {
      const collectorId =
        typeof collector.collector === 'string' ? collector.collector : collector.collector?.id
      return collectorId === userId && collector.status === 'accepted'
    })

    if (!isAcceptedCollector) {
      return Response.json(
        { success: false, message: 'You are not an active collector of this jar' },
        { status: 403 },
      )
    }

    // Remove the collector from the invited collectors list
    const updatedCollectors =
      jar.invitedCollectors?.filter((collector) => {
        const collectorId =
          typeof collector.collector === 'string' ? collector.collector : collector.collector?.id
        return collectorId !== userId
      }) || []

    await req.payload.update({
      collection: 'jars',
      id: jarId,
      data: { invitedCollectors: updatedCollectors },
      overrideAccess: true,
    })

    // Clean up any related notifications
    await req.payload.delete({
      collection: 'notifications',
      where: {
        'data.jarId': { equals: jarId },
        user: { equals: userId },
      },
    })

    return Response.json({ success: true, message: 'You have left the jar' }, { status: 200 })
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: 'Error processing request',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
