import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const acceptDeclineInvite = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    if (!req.user) {
      return Response.json(
        {
          success: false,
          message: 'User not authenticated',
        },
        { status: 401 },
      )
    }
    const { jarId, action } = req.data || {}

    // Validate required fields
    if (!jarId || !action) {
      return Response.json(
        {
          success: false,
          message: 'All fields are required: jarId, action',
        },
        { status: 400 },
      )
    }

    // Check if jar exists
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
    })

    if (!jar) {
      return Response.json(
        {
          success: false,
          message: 'Jar not found',
        },
        { status: 404 },
      )
    }

    const phoneNumbers = jar?.invitedCollectors
      ?.map((collector) => collector.phoneNumber)
      .filter((num): num is string => typeof num === 'string' && num.trim().length > 0)

    console.log(phoneNumbers, req.user?.phoneNumber)

    if (!phoneNumbers?.includes(req.user?.phoneNumber as string)) {
      return Response.json(
        {
          success: false,
          message: 'User is not invited to this jar',
        },
        { status: 403 },
      )
    }

    const userPhoneNumber = req?.user?.phoneNumber

    let invitedCollectors =
      jar?.invitedCollectors?.map((collector) => {
        if (collector?.phoneNumber === userPhoneNumber) {
          return { ...collector, status: 'accepted' as const, collector: req?.user?.id }
        }
        return collector
      }) || []

    if (action === 'decline') {
      invitedCollectors =
        invitedCollectors?.filter((collector) => collector.phoneNumber !== userPhoneNumber) || []

      await req.payload.delete({
        collection: 'notifications',
        where: {
          'data.jarId': { equals: jarId },
          user: { equals: req.user.id },
        },
      })
    } else {
      await req.payload.update({
        collection: 'notifications',
        where: {
          'data.jarId': { equals: jarId },
          user: { equals: req.user.id },
        },
        data: { status: 'read' },
      })
    }

    await req.payload.update({
      collection: 'jars',
      id: jarId,
      data: {
        invitedCollectors,
      },
      // Use admin context to bypass authentication requirements
      overrideAccess: true,
    })

    return Response.json(
      {
        success: true,
        message: 'Collector invited successfully',
        data: jar,
      },
      { status: 200 },
    )
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
