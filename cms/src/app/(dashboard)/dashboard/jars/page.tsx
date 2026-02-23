import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Container as JarIcon, CircleCheck, Lock, Hammer, Snowflake } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { JarsDataTable } from '@/components/dashboard/jars-data-table'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JarsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause
  const where: Record<string, any> = {}
  if (search) {
    where.name = { like: search }
  }
  if (status && ['open', 'frozen', 'broken', 'sealed'].includes(status)) {
    where.status = { equals: status }
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  // Run metric counts and paginated query in parallel
  const [totalJars, openJars, sealedJars, brokenJars, frozenJars, jarsResult] = await Promise.all([
    payload.count({ collection: 'jars', overrideAccess: true }),
    payload.count({ collection: 'jars', overrideAccess: true, where: { status: { equals: 'open' } } }),
    payload.count({ collection: 'jars', overrideAccess: true, where: { status: { equals: 'sealed' } } }),
    payload.count({ collection: 'jars', overrideAccess: true, where: { status: { equals: 'broken' } } }),
    payload.count({ collection: 'jars', overrideAccess: true, where: { status: { equals: 'frozen' } } }),
    payload.find({
      collection: 'jars',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
      select: {
        name: true,
        description: true,
        image: true,
        creator: true,
        status: true,
        goalAmount: true,
        invitedCollectors: true,
        currency: true,
        createdAt: true,
        deadline: true,
        isActive: true,
        isFixedContribution: true,
        acceptedContributionAmount: true,
        allowAnonymousContributions: true,
        thankYouMessage: true,
        freezeReason: true,
      },
    }),
  ])

  // Compute contribution totals, balance, and upcoming balance from transactions
  const jarIds = jarsResult.docs.map((jar: any) => jar.id)
  const contributionTotals: Record<string, number> = {}
  const settledTotals: Record<string, number> = {}
  const payoutTotals: Record<string, number> = {}
  const upcomingTotals: Record<string, number> = {}

  if (jarIds.length > 0) {
    const allTransactions = await payload.find({
      collection: 'transactions',
      where: {
        jar: { in: jarIds },
        paymentStatus: { in: ['completed', 'pending', 'transferred'] },
      },
      pagination: false,
      select: { jar: true, amountContributed: true, type: true, isSettled: true, paymentMethod: true, paymentStatus: true },
      overrideAccess: true,
    })

    for (const tx of allTransactions.docs as any[]) {
      const jarId = typeof tx.jar === 'string' ? tx.jar : tx.jar?.id
      if (!jarId) continue

      if (tx.type === 'contribution' && tx.paymentStatus === 'completed') {
        contributionTotals[jarId] = (contributionTotals[jarId] || 0) + (tx.amountContributed || 0)
        if (tx.isSettled) {
          settledTotals[jarId] = (settledTotals[jarId] || 0) + (tx.amountContributed || 0)
        }
        // Upcoming: completed but unsettled mobile money contributions
        if (!tx.isSettled && tx.paymentMethod === 'mobile-money') {
          upcomingTotals[jarId] = (upcomingTotals[jarId] || 0) + (tx.amountContributed || 0)
        }
      } else if (tx.type === 'payout') {
        // Payout amounts are stored as negative — include pending, completed, transferred
        payoutTotals[jarId] = (payoutTotals[jarId] || 0) + (tx.amountContributed || 0)
      }
    }
  }

  // Map to table rows
  const jars = jarsResult.docs.map((jar: any) => {
    const creatorObj = typeof jar.creator === 'object' && jar.creator ? jar.creator : null
    const creatorName = creatorObj
      ? `${creatorObj.firstName || ''} ${creatorObj.lastName || ''}`.trim() || creatorObj.email || 'Unknown'
      : 'Unknown'

    return {
      id: jar.id,
      name: jar.name,
      creatorName,
      creatorEmail: creatorObj?.email || '—',
      status: jar.status as 'open' | 'frozen' | 'broken' | 'sealed',
      goalAmount: jar.goalAmount || 0,
      totalContributions: contributionTotals[jar.id] || 0,
      balance: (settledTotals[jar.id] || 0) + (payoutTotals[jar.id] || 0),
      upcomingBalance: upcomingTotals[jar.id] || 0,
      contributorsCount: jar.invitedCollectors?.length || 0,
      currency: jar.currency || 'GHS',
      createdAt: jar.createdAt,
      description: jar.description || null,
      deadline: jar.deadline || null,
      isActive: jar.isActive ?? true,
      isFixedContribution: jar.isFixedContribution ?? false,
      acceptedContributionAmount: jar.acceptedContributionAmount || null,
      allowAnonymousContributions: jar.allowAnonymousContributions ?? false,
      thankYouMessage: jar.thankYouMessage || null,
      imageUrl: typeof jar.image === 'object' && jar.image?.url ? jar.image.url : null,
      freezeReason: jar.freezeReason || null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Total Jars"
          value={totalJars.totalDocs.toLocaleString()}
          icon={JarIcon}
        />
        <MetricCard
          title="Open"
          value={openJars.totalDocs.toLocaleString()}
          description="Actively accepting contributions"
          icon={CircleCheck}
        />
        <MetricCard
          title="Sealed"
          value={sealedJars.totalDocs.toLocaleString()}
          icon={Lock}
        />
        <MetricCard
          title="Broken"
          value={brokenJars.totalDocs.toLocaleString()}
          icon={Hammer}
        />
        <MetricCard
          title="Frozen"
          value={frozenJars.totalDocs.toLocaleString()}
          description="AML compliance holds"
          icon={Snowflake}
        />
      </div>

      {/* Jars Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jars</CardTitle>
          <CardDescription>
            {jarsResult.totalDocs} jar{jarsResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JarsDataTable
            jars={jars}
            pagination={{ currentPage: page, totalPages: jarsResult.totalPages, totalRows: jarsResult.totalDocs, rowsPerPage: limit }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
