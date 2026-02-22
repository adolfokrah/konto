import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Activity, TrendingUp, DollarSign, BarChart3 } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueTrendChart } from '@/components/dashboard/analytics/revenue-trend-chart'
import { PaymentMethodChart } from '@/components/dashboard/analytics/payment-method-chart'
import { TransactionStatusChart } from '@/components/dashboard/analytics/transaction-status-chart'
import { UserGrowthChart } from '@/components/dashboard/analytics/user-growth-chart'
import { TopJarsChart } from '@/components/dashboard/analytics/top-jars-chart'
import { KycStatusChart } from '@/components/dashboard/analytics/kyc-status-chart'
import { ContributionVolumeChart } from '@/components/dashboard/analytics/contribution-volume-chart'
import { TopContributorsChart } from '@/components/dashboard/analytics/top-contributors-chart'
import { JarStatusChart } from '@/components/dashboard/analytics/jar-status-chart'

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default async function AnalyticsPage() {
  const payload = await getPayload({ config: configPromise })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [
    // KPI: Daily Active Users (today)
    dauResult,
    // KPI + chart: Transaction status counts
    completedCount,
    pendingCount,
    failedCount,
    transferredCount,
    // KPI: Completed contributions (for avg transaction size)
    completedContributions,
    // KPI: Platform revenue
    revenueTransactions,
    // Chart: Payment method counts
    momoCount,
    cashCount,
    bankCount,
    cardCount,
    applePayCount,
    // Chart: Last 30 days revenue
    last30DaysRevenue,
    // Chart: User growth (last 30 days users + total before 30 days)
    last30DaysUsers,
    usersBefore30Days,
    // Chart: Top jars (completed contributions with jar refs)
    topJarsContributions,
    // Chart: KYC status counts
    kycNone,
    kycInReview,
    kycVerified,
    // Chart: Contribution volume (30 days)
    last30DaysContributions,
    // Chart: Top contributors
    contributorTransactions,
    // Chart: Jar status counts
    jarsOpen,
    jarsFrozen,
    jarsBroken,
    jarsSealed,
  ] = await Promise.all([
    // DAU today
    payload.count({
      collection: 'dailyActiveUsers',
      where: { createdAt: { greater_than_equal: todayStart } },
    }),

    // Transaction counts by status
    payload.count({
      collection: 'transactions',
      where: { paymentStatus: { equals: 'completed' } },
    }),
    payload.count({
      collection: 'transactions',
      where: { paymentStatus: { equals: 'pending' } },
    }),
    payload.count({
      collection: 'transactions',
      where: { paymentStatus: { equals: 'failed' } },
    }),
    payload.count({
      collection: 'transactions',
      where: { paymentStatus: { equals: 'transferred' } },
    }),

    // Completed contributions for avg size
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Platform revenue (hogapayRevenue from completed/transferred mobile-money)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { in: ['completed', 'transferred'] },
        paymentMethod: { equals: 'mobile-money' },
      },
      pagination: false,
      select: { chargesBreakdown: true },
      overrideAccess: true,
    }),

    // Payment method counts (completed contributions only)
    payload.count({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'mobile-money' },
      },
    }),
    payload.count({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'cash' },
      },
    }),
    payload.count({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'bank' },
      },
    }),
    payload.count({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'card' },
      },
    }),
    payload.count({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'apple-pay' },
      },
    }),

    // Last 30 days revenue transactions
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { in: ['completed', 'transferred'] },
        paymentMethod: { equals: 'mobile-money' },
        createdAt: { greater_than_equal: thirtyDaysAgo },
      },
      pagination: false,
      select: { chargesBreakdown: true, createdAt: true },
      overrideAccess: true,
    }),

    // Users registered in the last 30 days
    payload.find({
      collection: 'users',
      where: {
        role: { equals: 'user' },
        createdAt: { greater_than_equal: thirtyDaysAgo },
      },
      pagination: false,
      select: { createdAt: true },
      overrideAccess: true,
    }),

    // Users registered before 30 days ago (baseline)
    payload.count({
      collection: 'users',
      where: {
        role: { equals: 'user' },
        createdAt: { less_than: thirtyDaysAgo },
      },
    }),

    // Completed contributions with jar refs (for top jars)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      depth: 1,
      select: { amountContributed: true, jar: true },
      overrideAccess: true,
    }),

    // KYC status counts
    payload.count({
      collection: 'users',
      where: { role: { equals: 'user' }, kycStatus: { equals: 'none' } },
    }),
    payload.count({
      collection: 'users',
      where: { role: { equals: 'user' }, kycStatus: { equals: 'in_review' } },
    }),
    payload.count({
      collection: 'users',
      where: { role: { equals: 'user' }, kycStatus: { equals: 'verified' } },
    }),

    // Last 30 days completed contributions (for volume chart)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        createdAt: { greater_than_equal: thirtyDaysAgo },
      },
      pagination: false,
      select: { amountContributed: true, createdAt: true },
      overrideAccess: true,
    }),

    // All completed contributions with contributor name (for top contributors)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true, contributor: true },
      overrideAccess: true,
    }),

    // Jar status counts
    payload.count({
      collection: 'jars',
      where: { status: { equals: 'open' } },
    }),
    payload.count({
      collection: 'jars',
      where: { status: { equals: 'frozen' } },
    }),
    payload.count({
      collection: 'jars',
      where: { status: { equals: 'broken' } },
    }),
    payload.count({
      collection: 'jars',
      where: { status: { equals: 'sealed' } },
    }),
  ])

  // --- KPI calculations ---
  const totalCompleted = completedContributions.totalDocs
  const totalTransactions =
    completedCount.totalDocs + pendingCount.totalDocs + failedCount.totalDocs + transferredCount.totalDocs
  const successRate = totalTransactions > 0 ? (completedCount.totalDocs / totalTransactions) * 100 : 0

  const totalContributedAmount = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )
  const avgTransactionSize = totalCompleted > 0 ? totalContributedAmount / totalCompleted : 0

  const platformRevenue = revenueTransactions.docs.reduce(
    (sum, tx: any) => sum + (tx.chargesBreakdown?.hogapayRevenue || 0),
    0,
  )

  // --- Chart data: Payment Methods ---
  const paymentMethodData = [
    { name: 'Mobile Money', value: momoCount.totalDocs },
    { name: 'Cash', value: cashCount.totalDocs },
    { name: 'Bank', value: bankCount.totalDocs },
    { name: 'Card', value: cardCount.totalDocs },
    { name: 'Apple Pay', value: applePayCount.totalDocs },
  ].filter((d) => d.value > 0)

  // --- Chart data: Transaction Status ---
  const transactionStatusData = [
    { status: 'Completed', count: completedCount.totalDocs },
    { status: 'Pending', count: pendingCount.totalDocs },
    { status: 'Failed', count: failedCount.totalDocs },
    { status: 'Transferred', count: transferredCount.totalDocs },
  ].filter((d) => d.count > 0)

  // --- Chart data: Revenue Trend ---
  const revenueTrendData = buildRevenueTrendData(last30DaysRevenue.docs as any[])

  // --- Chart data: User Growth ---
  const userGrowthData = buildUserGrowthData(
    last30DaysUsers.docs as any[],
    usersBefore30Days.totalDocs,
  )

  // --- Chart data: Top Jars ---
  const topJarsData = buildTopJarsData(topJarsContributions.docs as any[])

  // --- Chart data: KYC Status ---
  const kycStatusData = [
    { name: 'Not Started', value: kycNone.totalDocs },
    { name: 'In Review', value: kycInReview.totalDocs },
    { name: 'Verified', value: kycVerified.totalDocs },
  ].filter((d) => d.value > 0)

  // --- Chart data: Contribution Volume ---
  const contributionVolumeData = buildContributionVolumeData(last30DaysContributions.docs as any[])

  // --- Chart data: Top Contributors ---
  const topContributorsData = buildTopContributorsData(contributorTransactions.docs as any[])

  // --- Chart data: Jar Status ---
  const jarStatusData = [
    { name: 'Open', value: jarsOpen.totalDocs },
    { name: 'Frozen', value: jarsFrozen.totalDocs },
    { name: 'Broken', value: jarsBroken.totalDocs },
    { name: 'Sealed', value: jarsSealed.totalDocs },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Daily Active Users"
          value={dauResult.totalDocs.toLocaleString()}
          description="Active today"
          icon={Activity}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          description={`${completedCount.totalDocs} of ${totalTransactions} transactions`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Transaction Size"
          value={`GHS ${fmt(avgTransactionSize)}`}
          description={`Across ${totalCompleted} contributions`}
          icon={BarChart3}
        />
        <MetricCard
          title="Platform Revenue"
          value={`GHS ${fmt(platformRevenue)}`}
          description="Total Hogapay revenue"
          icon={DollarSign}
        />
      </div>

      {/* Revenue Trend — full width */}
      <RevenueTrendChart data={revenueTrendData} />

      {/* Contribution Volume — full width */}
      <ContributionVolumeChart data={contributionVolumeData} />

      {/* Payment Methods + Transaction Status — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentMethodChart data={paymentMethodData} />
        <TransactionStatusChart data={transactionStatusData} />
      </div>

      {/* User Growth — full width */}
      <UserGrowthChart data={userGrowthData} />

      {/* Top Jars + KYC Status — 2/3 + 1/3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TopJarsChart data={topJarsData} />
        </div>
        <KycStatusChart data={kycStatusData} />
      </div>

      {/* Top Contributors + Jar Status — 2/3 + 1/3 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <TopContributorsChart data={topContributorsData} />
        </div>
        <JarStatusChart data={jarStatusData} />
      </div>
    </div>
  )
}

// --- Helper functions ---

function buildRevenueTrendData(docs: { chargesBreakdown?: { hogapayRevenue?: number }; createdAt: string }[]) {
  const daily: Record<string, number> = {}

  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    daily[date.toISOString().split('T')[0]] = 0
  }

  for (const doc of docs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in daily) {
      daily[key] += doc.chargesBreakdown?.hogapayRevenue || 0
    }
  }

  return Object.entries(daily).map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2)),
  }))
}

function buildUserGrowthData(
  recentDocs: { createdAt: string }[],
  baselineCount: number,
) {
  const daily: Record<string, number> = {}

  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    daily[date.toISOString().split('T')[0]] = 0
  }

  for (const doc of recentDocs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in daily) {
      daily[key] += 1
    }
  }

  // Convert to cumulative
  let cumulative = baselineCount
  return Object.entries(daily).map(([date, count]) => {
    cumulative += count
    return { date, totalUsers: cumulative }
  })
}

function buildContributionVolumeData(docs: { amountContributed?: number; createdAt: string }[]) {
  const daily: Record<string, number> = {}

  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    daily[date.toISOString().split('T')[0]] = 0
  }

  for (const doc of docs) {
    const key = new Date(doc.createdAt).toISOString().split('T')[0]
    if (key in daily) {
      daily[key] += doc.amountContributed || 0
    }
  }

  return Object.entries(daily).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2)),
  }))
}

function buildTopContributorsData(docs: { amountContributed?: number; contributor?: string }[]) {
  const totals: Record<string, number> = {}

  for (const doc of docs) {
    const name = doc.contributor || 'Anonymous'
    totals[name] = (totals[name] || 0) + (doc.amountContributed || 0)
  }

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, amount]) => ({
      name: name.length > 20 ? name.slice(0, 20) + '…' : name,
      amount: Number(amount.toFixed(2)),
    }))
}

function buildTopJarsData(docs: { amountContributed?: number; jar?: any }[]) {
  const jarTotals: Record<string, { name: string; amount: number }> = {}

  for (const doc of docs) {
    const jarObj = typeof doc.jar === 'object' && doc.jar ? doc.jar : null
    if (!jarObj) continue
    const jarId = jarObj.id as string
    if (!jarTotals[jarId]) {
      const name = (jarObj.name as string) || 'Unknown'
      jarTotals[jarId] = { name: name.length > 20 ? name.slice(0, 20) + '…' : name, amount: 0 }
    }
    jarTotals[jarId].amount += doc.amountContributed || 0
  }

  return Object.values(jarTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((j) => ({ name: j.name, amount: Number(j.amount.toFixed(2)) }))
}
