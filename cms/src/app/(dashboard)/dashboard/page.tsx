import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Users, Container as JarIcon, ArrowLeftRight, DollarSign, Receipt, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { RecentTransactionsTable } from '@/components/dashboard/recent-transactions-table'

export default async function DashboardPage() {
  const payload = await getPayload({ config: configPromise })

  // Run all queries in parallel
  const [
    totalUsersResult,
    totalJarsResult,
    activeJarsResult,
    completedContributions,
    todayDAU,
    recentTransactions,
    last30DaysContributions,
  ] = await Promise.all([
    // Total users (non-admin)
    payload.count({
      collection: 'users',
      where: { role: { equals: 'user' } },
    }),

    // Total jars
    payload.count({ collection: 'jars' }),

    // Active jars (status = open)
    payload.count({
      collection: 'jars',
      where: { status: { equals: 'open' } },
    }),

    // All completed contributions (for revenue + fees)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: {
        amountContributed: true,
        chargesBreakdown: true,
      },
      overrideAccess: true,
    }),

    // Today's active users
    payload.count({
      collection: 'daily-active-users',
      where: {
        createdAt: {
          greater_than_equal: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        },
      },
    }),

    // Recent 10 transactions
    payload.find({
      collection: 'transactions',
      sort: '-createdAt',
      limit: 10,
      depth: 1,
      overrideAccess: true,
    }),

    // Last 30 days completed contributions (for chart)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        createdAt: {
          greater_than_equal: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      pagination: false,
      select: {
        amountContributed: true,
        createdAt: true,
      },
      overrideAccess: true,
    }),
  ])

  // Calculate totals
  const totalRevenue = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  const totalPlatformFees = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.chargesBreakdown?.platformCharge || 0),
    0,
  )

  // Build 30-day chart data
  const chartData = buildChartData(last30DaysContributions.docs as any[])

  // Format recent transactions for the table
  const transactions = recentTransactions.docs.map((tx: any) => ({
    id: tx.id,
    contributor: tx.contributor,
    amountContributed: tx.amountContributed,
    paymentStatus: tx.paymentStatus,
    paymentMethod: tx.paymentMethod,
    type: tx.type,
    jar: tx.jar,
    createdAt: tx.createdAt,
  }))

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={totalUsersResult.totalDocs.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Total Jars"
          value={totalJarsResult.totalDocs.toLocaleString()}
          description={`${activeJarsResult.totalDocs} active`}
          icon={JarIcon}
        />
        <MetricCard
          title="Total Transactions"
          value={completedContributions.totalDocs.toLocaleString()}
          description="Completed contributions"
          icon={ArrowLeftRight}
        />
        <MetricCard
          title="Total Revenue"
          value={`GHS ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Platform Fees"
          value={`GHS ${totalPlatformFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Receipt}
        />
        <MetricCard
          title="Active Users Today"
          value={todayDAU.totalDocs.toLocaleString()}
          icon={Activity}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} />

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>The latest 10 transactions across all jars</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentTransactionsTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  )
}

function buildChartData(docs: { amountContributed: number; createdAt: string }[]) {
  const dailyMap: Record<string, number> = {}

  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    dailyMap[key] = 0
  }

  // Sum contributions by day
  for (const doc of docs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in dailyMap) {
      dailyMap[key] += doc.amountContributed || 0
    }
  }

  return Object.entries(dailyMap).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2)),
  }))
}
