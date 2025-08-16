import type { PayloadRequest } from 'payload'

export const getJarSummary = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      { status: 401 },
    )
  }

  // Extract jarId from URL parameters using req.routeParams
  const jarId = req.routeParams?.id as string

  // Find the jar with the given ID
  let jar: any = null
  try {
    if (jarId == 'null') {
      const jarResult = await req.payload.find({
        collection: 'jars',
        where: {
          creator: {
            equals: req.user,
          },
        },
        limit: 1,
        depth: 2,
      })
      if (jarResult.docs.length > 0) {
        jar = jarResult.docs[0]
      }
    } else {
      jar = await req.payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 2,
      })
    }
  } catch (error) {
    // If jar is not found, Payload throws a NotFound error
    return Response.json(
      {
        success: false,
        message: 'Jar not found',
      },
      { status: 404 },
    )
  }

  if (!jar) {
    return Response.json(
      {
        success: false,
        message: 'Jar not found',
      },
      { status: 404 },
    )
  }

  const jarLatestContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
    },
    limit: 10, // We don't need the actual contributions, just the count
  })

  const data = {
    ...jar,
    contributions: jarLatestContributions, // Return the full paginated structure
  }

  console.log(data)

  return Response.json({
    success: true,
    data,
  })
}
