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
    if (jarId != 'null' && jarId != null) {
      jar = await req.payload.findByID({
        collection: 'jars',
        id: jarId,
        depth: 2,
      })
    } else {
      //get user first jar
      jar = await getUserJar()
    }
  } catch (error) {
    jar = await getUserJar()
  }

  if (jar == null) {
    return Response.json(
      {
        success: true,
        message: 'Jar not found',
        data: null,
      },
      { status: 200 },
    )
  }

  async function getUserJar() {
    let jar = null
    const jarResult = await req.payload.find({
      collection: 'jars',
      pagination: false,
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
            status: {
              not_equals: 'broken',
            },
          },
        ],
      },
      limit: 1,
      depth: 2,
    })

    if (jarResult.docs.length > 0) {
      jar = jarResult.docs[0]
    }
    return jar
  }

  const recentJarContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      collector: {
        equals: req.user,
      },
    },
    limit: 10,
    sort: '-createdAt', // Sort by createdAt in descending order
  })

  const last100Contributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      collector: {
        equals: req.user,
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

  const allContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      collector: {
        equals: req.user,
      },
    },
    pagination: false,
    select: {
      amountContributed: true,
      paymentStatus: true,
      isTransferred: true,
      paymentMethod: true,
      type: true,
    },
  })

  // Helper function to calculate payment method breakdown
  const calculatePaymentMethodBreakdown = (contributions: any[]) => {
    const paymentMethods = {
      cash: { paymentMethod: 'cash', status: 'completed' },
      bankTransfer: { paymentMethod: 'bank-transfer', status: 'completed' },
      mobileMoney: { paymentMethod: 'mobile-money', status: 'completed' },
    }

    const breakdown: any = {}

    Object.entries(paymentMethods).forEach(([key, config]) => {
      const filtered = contributions.filter(
        contribution =>
          contribution.paymentMethod === config.paymentMethod &&
          contribution.paymentStatus === config.status,
      )

      breakdown[key] = {
        [`total${key.charAt(0).toUpperCase() + key.slice(1)}Amount`]: filtered.reduce(
          (sum, contrib) => sum + contrib.amountContributed,
          0,
        ),
        [`total${key.charAt(0).toUpperCase() + key.slice(1)}Count`]: filtered.length,
      }
    })

    return breakdown
  }

  const totalContributedAmount = allContributions.docs
    .filter(
      contribution =>
        contribution.paymentStatus === 'completed' && contribution.type === 'contribution',
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const totalTransfers = allContributions.docs
    .filter(
      contribution => contribution.paymentStatus === 'completed' && contribution.isTransferred,
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const totalAmountTobeTransferred = allContributions.docs
    .filter(
      contribution =>
        contribution.isTransferred === false &&
        contribution.paymentMethod === 'mobile-money' &&
        contribution.type === 'contribution' &&
        contribution.paymentStatus === 'completed',
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const paymentBreakdown = calculatePaymentMethodBreakdown(allContributions.docs)

  const data = {
    ...jar,
    contributions: recentJarContributions,
    chartData: totalContributionsChart(),
    isCreator: jar.creator?.id === req.user.id,
    balanceBreakDown: {
      totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
      totalTransfers: Number(totalTransfers.toFixed(2)),
      totalAmountTobeTransferred: Number(totalAmountTobeTransferred.toFixed(2)),
      ...paymentBreakdown,
    },
  }

  return Response.json({
    success: true,
    data,
    message: 'Jar summary retrieved successfully',
  })
}
