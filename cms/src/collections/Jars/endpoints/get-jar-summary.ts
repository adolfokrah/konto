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
      const jarResult = await req.payload.find({
        collection: 'jars',
        where: {
          id: {
            equals: jarId,
          },
        },
        depth: 2,
        limit: 1,
      })

      jar = jarResult.docs.length > 0 ? jarResult.docs[0] : null

      // Additional validation: ensure creator is actually a populated object, not just a string ID
      if (jar && typeof jar.creator === 'string') {
        // Creator is deleted (only string ID remains), fall back to getting user's first jar
        jar = await getUserJar()
      }

      // Check if user has access to this jar (either as creator or invited collector)
      if (jar) {
        const isCreator = jar.creator?.id === req.user!.id
        const isInvitedCollector = jar.invitedCollectors?.some(
          (collector: { collector?: { id: string } }) => collector.collector?.id === req.user!.id,
        )

        // If user doesn't have access, fall back to getting their first jar
        if (!isCreator && !isInvitedCollector) {
          jar = await getUserJar()
        }
      }
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
              equals: req.user!,
            },
            status: {
              not_equals: 'broken',
            },
          },
          {
            'invitedCollectors.collector': {
              equals: req.user!,
            },
            status: {
              not_equals: 'broken',
            },
          },
        ],
      },
      limit: 5, // Get more jars to find one with valid creator
      depth: 3,
    })

    // Find the first jar with a valid (populated) creator
    for (const foundJar of jarResult.docs) {
      if (typeof foundJar.creator === 'object' && foundJar.creator !== null) {
        jar = foundJar
        break
      }
    }

    return jar
  }

  // Check if user is the jar creator
  const isJarCreator = jar.creator?.id === req.user!.id

  const recentJarContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      ...(isJarCreator
        ? {}
        : {
            collector: {
              equals: req.user!,
            },
          }),
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
      ...(isJarCreator
        ? {}
        : {
            collector: {
              equals: req.user!,
            },
          }),
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
    const chartPoints = last10Days.map((date) => {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return dailyContributions[dateKey] || 0
    })

    return chartPoints
  }

  const transactionsPerPaymentMethod = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      paymentStatus: {
        equals: 'completed',
      },
    },
    pagination: false,
    select: {
      paymentMethod: true,
      amountContributed: true,
    },
  })

  const allContributions = await req.payload.find({
    collection: 'contributions',
    where: {
      jar: {
        equals: jar.id,
      },
      ...(isJarCreator
        ? {}
        : {
            collector: {
              equals: req.user!,
            },
          }),
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
      bankTransfer: { paymentMethod: 'bank', status: 'completed' },
      mobileMoney: { paymentMethod: 'mobile-money', status: 'completed' },
      card: { paymentMethod: 'card', status: 'completed' },
      applePay: { paymentMethod: 'apple-pay', status: 'completed' },
    }

    const breakdown: any = {}

    Object.entries(paymentMethods).forEach(([key, config]) => {
      const filtered = contributions.filter(
        (contribution) =>
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
      (contribution) =>
        contribution.paymentStatus === 'completed' && contribution.type === 'contribution',
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const totalTransfers = allContributions.docs
    .filter(
      (contribution) => contribution.paymentStatus === 'completed' && contribution.isTransferred,
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const totalAmountTobeTransferred = allContributions.docs
    .filter(
      (contribution) =>
        contribution.isTransferred === false &&
        (contribution.paymentMethod === 'mobile-money' ||
          contribution.paymentMethod === 'card' ||
          contribution.paymentMethod === 'bank') &&
        contribution.type === 'contribution' &&
        contribution.paymentStatus === 'completed',
    )
    .reduce((sum: number, contribution: any) => sum + contribution.amountContributed, 0)

  const paymentBreakdown = calculatePaymentMethodBreakdown(allContributions.docs)

  const data = {
    ...jar,
    invitedCollectors: jar.invitedCollectors.filter(
      (invitedCollector: { collector?: any }) => typeof invitedCollector.collector === 'object',
    ), // Hide invited collectors for privacy
    contributions: recentJarContributions,
    chartData: totalContributionsChart(),
    isCreator: jar.creator?.id === req.user!.id,
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
