import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Container as JarIcon, CircleCheck, Lock, Hammer, Snowflake } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { JarsTable } from '@/components/dashboard/jars-table'
import { JarsFilters } from '@/components/dashboard/jars-filters'
import { JarsPagination } from '@/components/dashboard/jars-pagination'

const LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JarsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause
  const where: Record<string, any> = {}
  if (search) {
    where.name = { like: search }
  }
  if (status && ['open', 'frozen', 'broken', 'sealed'].includes(status)) {
    where.status = { equals: status }
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
      limit: LIMIT,
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

  // Compute actual contribution sums from transactions for each jar
  const jarIds = jarsResult.docs.map((jar: any) => jar.id)
  const contributionTotals: Record<string, number> = {}

  if (jarIds.length > 0) {
    const contributions = await payload.find({
      collection: 'transactions',
      where: {
        jar: { in: jarIds },
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { jar: true, amountContributed: true },
      overrideAccess: true,
    })

    for (const tx of contributions.docs as any[]) {
      const jarId = typeof tx.jar === 'string' ? tx.jar : tx.jar?.id
      if (jarId) {
        contributionTotals[jarId] = (contributionTotals[jarId] || 0) + (tx.amountContributed || 0)
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Jars</CardTitle>
              <CardDescription>
                {jarsResult.totalDocs} jar{jarsResult.totalDocs !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <JarsFilters />
          </div>
        </CardHeader>
        <CardContent>
          <JarsTable jars={jars} />
          <JarsPagination currentPage={page} totalPages={jarsResult.totalPages} />
        </CardContent>
      </Card>
    </div>
  )
}
