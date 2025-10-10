import type { PayloadRequest } from 'payload'

export const getUserJars = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json(
      {
        success: false,
        message: 'Unauthorized',
      },
      { status: 401 },
    )
  }
  try {
    const jars = await req.payload.find({
      collection: 'jars',
      where: {
        or: [
          {
            creator: {
              equals: req.user,
            },
            status: {
              not_equals: 'broken',
            },
          },
          {
            'invitedCollectors.collector': {
              equals: req.user,
            },
            'invitedCollectors.status': {
              equals: 'accepted',
            },
            status: {
              not_equals: 'broken',
            },
          },
        ],
      },
      depth: 2,
      limit: 1000,
    })

    // Filter out jars where creator is not an object (deleted users)
    const validJars = {
      ...jars,
      docs: jars.docs.filter((jar: any) => typeof jar.creator === 'object' && jar.creator !== null),
    }

    // Group jars by jarGroup with enhanced data structure
    const groupedJars = validJars.docs.reduce(async (groupsPromise: any, jar: any) => {
      const groups = await groupsPromise

      // Handle jarGroup being either a string ID or a populated object
      const groupId =
        typeof jar.jarGroup === 'object' && jar.jarGroup?.id
          ? jar.jarGroup.id
          : jar.jarGroup || 'ungrouped'
      const groupName =
        typeof jar.jarGroup === 'object' && jar.jarGroup?.name
          ? jar.jarGroup.name
          : jar.jarGroup || 'Ungrouped'

      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          name: groupName,
          description: null,
          jars: [],
          totalJars: 0,
          totalGoalAmount: 0,
          totalContributions: 0,
          createdAt: null,
          updatedAt: null,
        }
      }

      // Get completed contributions for this jar
      const contributions = await req.payload.find({
        collection: 'contributions',
        where: {
          and: [
            {
              jar: {
                equals: jar.id,
              },
            },
            {
              paymentStatus: {
                equals: 'completed',
              },
            },
            {
              collector: {
                equals: req.user,
              },
            },
          ],
        },
        pagination: false,
        select: {
          amountContributed: true,
        },
      })

      // Calculate total contributions for this jar
      const jarTotalContributions = contributions.docs.reduce(
        (total: number, contribution: any) => {
          return total + (contribution.amountContributed || 0)
        },
        0,
      )

      // Add jar with essential data for the mobile app
      groups[groupId].jars.push({
        id: jar.id,
        name: jar.name,
        description: jar.description,
        image: jar.image
          ? {
              id: jar.image.id,
              url: jar.image.url,
              filename: jar.image.filename,
            }
          : null,
        isActive: jar.isActive,
        isFixedContribution: jar.isFixedContribution,
        acceptedContributionAmount: jar.acceptedContributionAmount,
        goalAmount: jar.goalAmount || 0,
        deadline: jar.deadline,
        currency: jar.currency,
        creator: {
          id: jar.creator.id,
          name: jar.creator.name,
          profilePicture: jar.creator.profilePicture
            ? {
                id: jar.creator.profilePicture.id,
                url: jar.creator.profilePicture.url,
              }
            : null,
        },
        paymentLink: jar.paymentLink,
        acceptAnonymousContributions: jar.acceptAnonymousContributions,
        createdAt: jar.createdAt,
        updatedAt: jar.updatedAt,
        totalContributions: jarTotalContributions,
      })

      groups[groupId].totalJars += 1
      groups[groupId].totalGoalAmount += jar.goalAmount || 0
      groups[groupId].totalContributions += jarTotalContributions

      return groups
    }, Promise.resolve({}))

    // Convert to array format and sort groups
    const resolvedGroups = await groupedJars
    const groupedJarsArray = Object.values(resolvedGroups).sort((a: any, b: any) => {
      // Put ungrouped at the end
      if (a.id === 'ungrouped') return 1
      if (b.id === 'ungrouped') return -1
      // Sort by name otherwise
      return a.name.localeCompare(b.name)
    })

    return Response.json({
      success: true,
      data: groupedJarsArray,
    })
  } catch (error: any) {
    // If jar is not found, Payload throws a NotFound error
    return Response.json(
      {
        success: true,
        message: 'No Jars found',
        error: error.message || 'Unknown error',
      },
      { status: 200 },
    )
  }
}
