import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Users, Container as JarIcon, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TransactionsDataTable } from '@/components/dashboard/transactions-data-table'
import { type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'

export default async function DashboardPage() {
  const payload = await getPayload({ config: configPromise })

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [
    totalUsersResult,
    totalJarsResult,
    activeJarsResult,
    dauResult,
    recentTransactions,
    last30DaysContributions,
    last30DaysPayouts,
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

    // DAU today
    payload.count({
      collection: 'dailyActiveUsers',
      where: { createdAt: { greater_than_equal: todayStart } },
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

    // Last 30 days payouts (for chart)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'payout' },
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

  // Build 30-day chart data with both series
  const chartData = buildChartData(
    last30DaysContributions.docs as any[],
    last30DaysPayouts.docs as any[],
  )

  // Format recent transactions for the table
  const transactions: TransactionRow[] = recentTransactions.docs.map((tx: any) => {
    const jarObj = typeof tx.jar === 'object' && tx.jar ? tx.jar : null
    const collectorObj = typeof tx.collector === 'object' && tx.collector ? tx.collector : null

    return {
      id: tx.id,
      contributor: tx.contributor || null,
      contributorPhoneNumber: tx.contributorPhoneNumber || null,
      jar: jarObj ? { id: jarObj.id, name: jarObj.name } : null,
      paymentMethod: tx.paymentMethod || null,
      mobileMoneyProvider: tx.mobileMoneyProvider || null,
      accountNumber: tx.accountNumber || null,
      amountContributed: tx.amountContributed || 0,
      chargesBreakdown: tx.chargesBreakdown || null,
      paymentStatus: tx.paymentStatus || 'pending',
      type: tx.type,
      isSettled: tx.isSettled ?? false,
      payoutFeePercentage: tx.payoutFeePercentage ?? null,
      payoutFeeAmount: tx.payoutFeeAmount ?? null,
      payoutNetAmount: tx.payoutNetAmount ?? null,
      transactionReference: tx.transactionReference || null,
      collector: collectorObj
        ? {
            id: collectorObj.id,
            firstName: collectorObj.firstName || '',
            lastName: collectorObj.lastName || '',
            email: collectorObj.email || '',
          }
        : null,
      viaPaymentLink: tx.viaPaymentLink ?? false,
      createdAt: tx.createdAt,
    }
  })

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
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
          title="Daily Active Users"
          value={dauResult.totalDocs.toLocaleString()}
          description="Active today"
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
          <TransactionsDataTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  )
}

function buildChartData(
  contributionDocs: { amountContributed: number; createdAt: string }[],
  payoutDocs: { amountContributed: number; createdAt: string }[],
) {
  const contributions: Record<string, number> = {}
  const payouts: Record<string, number> = {}

  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    contributions[key] = 0
    payouts[key] = 0
  }

  for (const doc of contributionDocs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in contributions) {
      contributions[key] += Math.abs(doc.amountContributed || 0)
    }
  }

  for (const doc of payoutDocs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in payouts) {
      payouts[key] += Math.abs(doc.amountContributed || 0)
    }
  }

  return Object.keys(contributions).map((date) => ({
    date,
    contributions: Number(contributions[date].toFixed(2)),
    payouts: -Number(payouts[date].toFixed(2)),
  }))
}
