import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TransactionCountChart } from '@/components/dashboard/transaction-count-chart'
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
      limit: 15,
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

  // Build 30-day chart data
  const chartData = buildChartData(
    last30DaysContributions.docs as any[],
    last30DaysPayouts.docs as any[],
  )

  // Summary stats
  const totalContributions = (last30DaysContributions.docs as any[]).reduce(
    (sum, doc) => sum + Math.abs(doc.amountContributed || 0), 0,
  )
  const totalPayouts = (last30DaysPayouts.docs as any[]).reduce(
    (sum, doc) => sum + Math.abs(doc.amountContributed || 0), 0,
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
      {/* Compact stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Users</p>
          <p className="text-2xl font-semibold mt-1">{totalUsersResult.totalDocs.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{dauResult.totalDocs} active today</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jars</p>
          <p className="text-2xl font-semibold mt-1">{totalJarsResult.totalDocs.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{activeJarsResult.totalDocs} open</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Contributions (30d)</p>
          <p className="text-2xl font-semibold mt-1">
            GHS {totalContributions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{last30DaysContributions.totalDocs} transactions</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Payouts (30d)</p>
          <p className="text-2xl font-semibold mt-1">
            GHS {totalPayouts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{last30DaysPayouts.totalDocs} transactions</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueChart data={chartData} />
        <TransactionCountChart data={chartData} />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>The latest 15 transactions across all jars</CardDescription>
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
  const contributionCounts: Record<string, number> = {}
  const payoutCounts: Record<string, number> = {}

  // Initialize last 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    contributions[key] = 0
    payouts[key] = 0
    contributionCounts[key] = 0
    payoutCounts[key] = 0
  }

  for (const doc of contributionDocs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in contributions) {
      contributions[key] += Math.abs(doc.amountContributed || 0)
      contributionCounts[key] += 1
    }
  }

  for (const doc of payoutDocs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in payouts) {
      payouts[key] += Math.abs(doc.amountContributed || 0)
      payoutCounts[key] += 1
    }
  }

  return Object.keys(contributions).map((date) => ({
    date,
    contributions: Number(contributions[date].toFixed(2)),
    payouts: Number(payouts[date].toFixed(2)),
    contributionCount: contributionCounts[date],
    payoutCount: payoutCounts[date],
  }))
}
