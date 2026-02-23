import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Users, Container as JarIcon, ArrowLeftRight, DollarSign, Receipt, Smartphone, Banknote } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { DataTable } from '@/components/dashboard/data-table/data-table'
import { transactionColumns, type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'

export default async function DashboardPage() {
  const payload = await getPayload({ config: configPromise })

  // Run all queries in parallel
  const [
    totalUsersResult,
    totalJarsResult,
    activeJarsResult,
    completedContributions,
    completedPayouts,
    revenueTransactions,
    momoContributionsResult,
    cashContributionsResult,
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

    // All completed contributions
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: {
        amountContributed: true,
      },
      overrideAccess: true,
    }),

    // All completed payouts (for transfer fee revenue)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'payout' },
      },
      pagination: false,
      select: {
        amountContributed: true,
      },
      overrideAccess: true,
    }),

    // All completed mobile money transactions (for stored Hogapay revenue)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        paymentMethod: { equals: 'mobile-money' },
      },
      pagination: false,
      select: {
        chargesBreakdown: true,
      },
      overrideAccess: true,
    }),

    // Mobile money contributions total
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'mobile-money' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Cash contributions total
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'cash' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
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

  // Total contributions volume
  const totalContributions = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  // Total payouts volume
  const totalPayouts = completedPayouts.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  // Mobile money contributions volume
  const totalMomoContributions = momoContributionsResult.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  // Cash contributions volume
  const totalCashContributions = cashContributionsResult.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  // Hogapay revenue from stored chargesBreakdown.hogapayRevenue
  const platformRevenue = revenueTransactions.docs.reduce(
    (sum, tx: any) => sum + (tx.chargesBreakdown?.hogapayRevenue || 0),
    0,
  )

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
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Total Contributions"
          value={`GHS ${totalContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Payouts"
          value={`GHS ${totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={ArrowLeftRight}
        />
        <MetricCard
          title="Hogapay Revenue"
          value={`GHS ${platformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`0.8% collections + 0.5% transfers`}
          icon={Receipt}
        />
        <MetricCard
          title="MoMo Contributions"
          value={`GHS ${totalMomoContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`${momoContributionsResult.totalDocs} transactions`}
          icon={Smartphone}
        />
        <MetricCard
          title="Cash Contributions"
          value={`GHS ${totalCashContributions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          description={`${cashContributionsResult.totalDocs} transactions`}
          icon={Banknote}
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
          <DataTable columns={transactionColumns} data={transactions} readOnly />
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
