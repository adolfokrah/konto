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

  const recentJarContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
    },
    limit: 10,
  })

  const last100Contributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
    },
    limit: 100, // Fetch the last 100 contributions for detailed analysis
  })

  const totalContributionsChart = () => {
    // Filter completed contributions only
    const completedContributions = last100Contributions.docs.filter(
      (contribution: any) => contribution.paymentStatus === 'completed',
    )

    if (completedContributions.length === 0) {
      // Return 10 days of zero values if no contributions
      return Array(10).fill(0)
    }

    // Get the date range for the last 10 days from today
    const now = new Date()
    const last10Days = []
    for (let i = 9; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      last10Days.push(date)
    }

    // Group contributions by day and sum amounts
    const dailyContributions: { [key: string]: number } = {}

    completedContributions.forEach((contribution: any) => {
      const contributionDate = new Date(contribution.createdAt)
      const dateKey = `${contributionDate.getFullYear()}-${String(contributionDate.getMonth() + 1).padStart(2, '0')}-${String(contributionDate.getDate()).padStart(2, '0')}`

      if (!dailyContributions[dateKey]) {
        dailyContributions[dateKey] = 0
      }
      dailyContributions[dateKey] += contribution.amountContributed
    })

    // Create chart data points for the last 10 days
    const chartPoints = last10Days.map(date => {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return dailyContributions[dateKey] || 0
    })

    return chartPoints
  }

  const data = {
    ...jar,
    contributions: recentJarContributions, // Return the full paginated structure
    chartData: totalContributionsChart(), // Add chart data for the last 10 days
  }

  return Response.json({
    success: true,
    data,
  })
}
