import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  DollarSign,
  BarChart3,
  Wallet,
  Clock,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Receipt,
  Smartphone,
  Banknote,
  TrendingDown,
  RefreshCw,
  Users2,
  Percent,
  Target,
  Repeat2,
} from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { RevenueTrendChart } from '@/components/dashboard/analytics/revenue-trend-chart'
import { PaymentMethodChart } from '@/components/dashboard/analytics/payment-method-chart'
import { TransactionStatusChart } from '@/components/dashboard/analytics/transaction-status-chart'
import { UserGrowthChart } from '@/components/dashboard/analytics/user-growth-chart'
import { TopJarsChart } from '@/components/dashboard/analytics/top-jars-chart'
import { KycStatusChart } from '@/components/dashboard/analytics/kyc-status-chart'
import { ContributionVolumeChart } from '@/components/dashboard/analytics/contribution-volume-chart'
import { ContributionVolumeByMethodChart } from '@/components/dashboard/analytics/contribution-volume-by-method-chart'
import { TimeRangeSelector } from '@/components/dashboard/analytics/time-range-selector'
import { Suspense } from 'react'
import { TopContributorsChart } from '@/components/dashboard/analytics/top-contributors-chart'
import { JarStatusChart } from '@/components/dashboard/analytics/jar-status-chart'
import { NewJarsTrendChart } from '@/components/dashboard/analytics/new-jars-trend-chart'
import { PayoutVolumeTrendChart } from '@/components/dashboard/analytics/payout-volume-trend-chart'
import { FailedTransactionsTrendChart } from '@/components/dashboard/analytics/failed-transactions-trend-chart'
import { RefundVolumeTrendChart } from '@/components/dashboard/analytics/refund-volume-trend-chart'
import { ProviderSplitChart } from '@/components/dashboard/analytics/provider-split-chart'
import { RevenueBreakdownChart } from '@/components/dashboard/analytics/revenue-breakdown-chart'
import { CollectorPerformanceChart } from '@/components/dashboard/analytics/collector-performance-chart'

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Range = 'daily' | 'monthly' | 'yearly'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rawRange } = await searchParams
  const range: Range =
    rawRange === 'monthly' ? 'monthly' : rawRange === 'yearly' ? 'yearly' : 'daily'

  const payload = await getPayload({ config: configPromise })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Chart-specific start dates based on selected range
  const chartStartDate =
    range === 'yearly'
      ? new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString()
      : range === 'monthly'
        ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        : thirtyDaysAgo

  const [
    // KPI + chart: Transaction status counts
    completedCount,
    pendingCount,
    failedCount,
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
    // KPI: Payouts (for balance calculation)
    completedPayouts,
    // KPI: Unsettled mobile money contributions (upcoming balance)
    unsettledMomoContributions,
    // KPI: Total transaction count
    totalTransactionCount,
    // KPI: Payouts volume (completed)
    payoutsVolume,
    // KPI: Refund revenue
    refundRevenueResult,
    // Chart: Refund revenue (last 30 days)
    last30DaysRefundRevenue,
    momoContributionsResult,
    cashContributionsResult,
    // Chart: Contribution volume by payment method (last 30 days)
    last30DaysContributionsByMethod,
    // Chart: New jars created (range-aware)
    newJarsInRange,
    // Chart: Payouts in range (trend)
    payoutsInRange,
    // Chart: Failed transactions in range (trend)
    failedInRange,
    // Chart + KPI: Refunds in range (amount + createdAt)
    refundsInRange,
    // KPI: All refunds count (for refund rate)
    allRefundsCount,
    // Chart: MTN contributions
    mtnContributions,
    // Chart: Telecel contributions
    telecelContributions,
    // Chart: Collector performance
    collectorContributions,
  ] = await Promise.all([
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
    // Completed contributions for avg size + balance calculation
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true, isSettled: true },
      overrideAccess: true,
    }),

    // Platform revenue (hogapayRevenue from all completed mobile-money transactions)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        paymentMethod: { equals: 'mobile-money' },
      },
      pagination: false,
      select: { chargesBreakdown: true, type: true },
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

    // Chart: revenue transactions (range-aware)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        paymentMethod: { equals: 'mobile-money' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { chargesBreakdown: true, createdAt: true },
      overrideAccess: true,
    }),

    // Users registered in chart range (range-aware)
    payload.find({
      collection: 'users',
      where: {
        role: { equals: 'user' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { createdAt: true },
      overrideAccess: true,
    }),

    // Users registered before chart range (baseline for cumulative)
    payload.count({
      collection: 'users',
      where: {
        role: { equals: 'user' },
        createdAt: { less_than: chartStartDate },
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

    // Chart: contribution volume (range-aware)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        createdAt: { greater_than_equal: chartStartDate },
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
      select: { amountContributed: true, contributor: true, contributorPhoneNumber: true },
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

    // Payouts (for total jar balance — amounts are stored as negative)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { in: ['pending', 'completed', 'awaiting-approval'] },
        type: { equals: 'payout' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Unsettled mobile money contributions (upcoming balance)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'mobile-money' },
        isSettled: { equals: false },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Total transaction count
    payload.count({ collection: 'transactions', overrideAccess: true }),

    // Payouts volume (completed)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'payout' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Refund hogapay revenue (completed refunds)
    payload.find({
      collection: 'refunds' as any,
      where: {
        status: { equals: 'completed' },
      },
      pagination: false,
      select: { hogapayRevenue: true },
      overrideAccess: true,
    }),

    // Chart: refund revenue (range-aware)
    payload.find({
      collection: 'refunds' as any,
      where: {
        status: { equals: 'completed' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { hogapayRevenue: true, createdAt: true },
      overrideAccess: true,
    }),

    // Mobile money contributions (amounts)
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

    // Cash contributions (amounts)
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

    // Chart: contribution volume by method (range-aware)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { amountContributed: true, createdAt: true, paymentMethod: true },
      overrideAccess: true,
    }),

    // Chart: new jars created (range-aware)
    payload.find({
      collection: 'jars',
      where: { createdAt: { greater_than_equal: chartStartDate } },
      pagination: false,
      select: { createdAt: true },
      overrideAccess: true,
    }),

    // Chart: payout volume (range-aware)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'payout' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { amountContributed: true, createdAt: true },
      overrideAccess: true,
    }),

    // Chart: failed transactions (range-aware)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'failed' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { createdAt: true },
      overrideAccess: true,
    }),

    // Chart + KPI: refunds in range (for refund volume trend)
    payload.find({
      collection: 'refunds' as any,
      where: {
        status: { equals: 'completed' },
        createdAt: { greater_than_equal: chartStartDate },
      },
      pagination: false,
      select: { amount: true, createdAt: true },
      overrideAccess: true,
    }),

    // KPI: all completed refunds count (for refund rate)
    payload.count({
      collection: 'refunds' as any,
      where: { status: { equals: 'completed' } },
      overrideAccess: true,
    }),

    // Chart: MTN contributions (volume + count)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'mobile-money' },
        mobileMoneyProvider: { equals: 'mtn' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Chart: Telecel contributions (volume + count)
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
        paymentMethod: { equals: 'mobile-money' },
        mobileMoneyProvider: { equals: 'telecel' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    }),

    // Chart: Collector performance (jar creators ranked by total collected)
    // No select — depth 2 must fully populate jar.createdBy for name resolution
    payload.find({
      collection: 'transactions',
      where: {
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      depth: 2,
      overrideAccess: true,
    }),
  ])

  // --- KPI calculations ---
  const totalCompleted = completedContributions.totalDocs
  const completedTotal = completedCount.totalDocs
  const totalTransactions =
    completedTotal + pendingCount.totalDocs + failedCount.totalDocs
  const successRate = totalTransactions > 0 ? (completedTotal / totalTransactions) * 100 : 0

  const totalContributedAmount = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )
  const avgTransactionSize = totalCompleted > 0 ? totalContributedAmount / totalCompleted : 0

  const transactionRevenue = revenueTransactions.docs.reduce(
    (sum, tx: any) => sum + Math.abs(tx.chargesBreakdown?.hogapayRevenue || 0),
    0,
  )
  const refundRevenue = refundRevenueResult.docs.reduce(
    (sum, r: any) => sum + Math.abs(r.hogapayRevenue || 0),
    0,
  )
  const platformRevenue = transactionRevenue + refundRevenue

  const totalPayoutsAmount = completedPayouts.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )
  // Balance = settled contributions + payouts (payouts are negative)
  const totalSettledContributions = completedContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.isSettled ? (tx.amountContributed || 0) : 0),
    0,
  )
  const totalJarBalances = totalSettledContributions + totalPayoutsAmount

  const totalUpcomingBalances = unsettledMomoContributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  const totalPayoutsVolume = payoutsVolume.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  const totalMomoContributions = momoContributionsResult.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  const totalCashContributions = cashContributionsResult.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
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
    { status: 'Completed', count: completedTotal },
    { status: 'Pending', count: pendingCount.totalDocs },
    { status: 'Failed', count: failedCount.totalDocs },
  ].filter((d) => d.count > 0)

  // --- Chart data: Revenue Trend ---
  const revenueTrendData = buildRevenueTrendData(
    last30DaysRevenue.docs as any[],
    last30DaysRefundRevenue.docs as any[],
    range,
  )

  // --- Chart data: User Growth ---
  const userGrowthData = buildUserGrowthData(
    last30DaysUsers.docs as any[],
    usersBefore30Days.totalDocs,
    range,
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
  const contributionVolumeData = buildContributionVolumeData(last30DaysContributions.docs as any[], range)

  // --- Chart data: Contribution Volume by Method ---
  const contributionVolumeByMethodData = buildContributionVolumeByMethodData(last30DaysContributionsByMethod.docs as any[], range)

  // --- Chart data: Top Contributors ---
  const topContributorsData = buildTopContributorsData(contributorTransactions.docs as any[])

  // --- Chart data: Jar Status ---
  const jarStatusData = [
    { name: 'Open', value: jarsOpen.totalDocs },
    { name: 'Frozen', value: jarsFrozen.totalDocs },
    { name: 'Broken', value: jarsBroken.totalDocs },
    { name: 'Sealed', value: jarsSealed.totalDocs },
  ].filter((d) => d.value > 0)

  // --- New KPI calculations ---
  const totalJars = jarsOpen.totalDocs + jarsFrozen.totalDocs + jarsBroken.totalDocs + jarsSealed.totalDocs
  // Jars with at least one completed contribution = unique jar IDs in topJarsContributions
  const jarsWithContributions = new Set(
    topJarsContributions.docs.map((tx: any) => {
      const jar = tx.jar
      return typeof jar === 'object' && jar ? jar.id : jar
    }).filter(Boolean)
  ).size
  const jarConversionRate = totalJars > 0 ? (jarsWithContributions / totalJars) * 100 : 0

  const avgContributionsPerJar = jarsWithContributions > 0 ? totalCompleted / jarsWithContributions : 0

  const allRefundsTotal = allRefundsCount.totalDocs
  const refundRate = totalCompleted > 0 ? (allRefundsTotal / totalCompleted) * 100 : 0

  // Repeat contributors = phone numbers that appear in more than one contribution
  const phoneCounts: Record<string, number> = {}
  for (const tx of contributorTransactions.docs as any[]) {
    const key = tx.contributorPhoneNumber || tx.contributor || ''
    if (key) phoneCounts[key] = (phoneCounts[key] || 0) + 1
  }
  const repeatContributors = Object.values(phoneCounts).filter((c) => c > 1).length

  // --- Chart data: New Jars Trend ---
  const newJarsTrendData = buildCountTrendData(newJarsInRange.docs as any[], range)

  // --- Chart data: Payout Volume Trend ---
  const payoutVolumeTrendData = buildAmountTrendData(payoutsInRange.docs as any[], range)

  // --- Chart data: Failed Transactions Trend ---
  const failedTransactionsTrendData = buildCountTrendData(failedInRange.docs as any[], range)

  // --- Chart data: Refund Volume Trend ---
  const refundVolumeTrendData = buildRefundVolumeTrendData(refundsInRange.docs as any[], range)

  // --- Chart data: Provider Split ---
  const mtnVolume = mtnContributions.docs.reduce((s: number, tx: any) => s + (tx.amountContributed || 0), 0)
  const telecelVolume = telecelContributions.docs.reduce((s: number, tx: any) => s + (tx.amountContributed || 0), 0)
  const providerSplitData = [
    { provider: 'MTN', volume: Number(mtnVolume.toFixed(2)), count: mtnContributions.totalDocs },
    { provider: 'Telecel', volume: Number(telecelVolume.toFixed(2)), count: telecelContributions.totalDocs },
  ].filter((d) => d.count > 0)

  // --- Chart data: Revenue Breakdown ---
  const collectionFeeRevenue = (revenueTransactions.docs as any[])
    .filter((tx: any) => tx.type === 'contribution' || !tx.type)
    .reduce((s: number, tx: any) => s + Math.abs(tx.chargesBreakdown?.hogapayRevenue || 0), 0)
  const transferFeeRevenue = (revenueTransactions.docs as any[])
    .filter((tx: any) => tx.type === 'payout')
    .reduce((s: number, tx: any) => s + Math.abs(tx.chargesBreakdown?.hogapayRevenue || 0), 0)
  const revenueBreakdownData = [
    { category: 'Collection Fees', amount: Number(collectionFeeRevenue.toFixed(2)) },
    { category: 'Transfer Fees', amount: Number(transferFeeRevenue.toFixed(2)) },
    { category: 'Refund Fees', amount: Number(refundRevenue.toFixed(2)) },
  ].filter((d) => d.amount > 0)

  // --- Chart data: Collector Performance ---
  const collectorPerformanceData = buildCollectorPerformanceData(collectorContributions.docs as any[])

  return (
    <div className="space-y-6">
      {/* Engagement KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Jar Conversion Rate"
          value={`${jarConversionRate.toFixed(1)}%`}
          description={`${jarsWithContributions} of ${totalJars} jars received contributions`}
          icon={Target}
        />
        <MetricCard
          title="Avg Contributions / Jar"
          value={avgContributionsPerJar.toFixed(1)}
          description="Among jars with at least one contribution"
          icon={Percent}
        />
        <MetricCard
          title="Refund Rate"
          value={`${refundRate.toFixed(2)}%`}
          description={`${allRefundsTotal} refunds out of ${totalCompleted} completed`}
          icon={RefreshCw}
        />
        <MetricCard
          title="Repeat Contributors"
          value={repeatContributors.toLocaleString()}
          description="Users who contributed more than once"
          icon={Repeat2}
        />
      </div>

      {/* Volume & Revenue */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Contributions"
          value={`GHS ${fmt(totalContributedAmount)}`}
          description={`${completedContributions.totalDocs} completed`}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Payouts"
          value={`-GHS ${fmt(Math.abs(totalPayoutsVolume))}`}
          icon={ArrowUpRight}
          valueClassName="text-red-400"
        />
        <MetricCard
          title="MoMo Contributions"
          value={`GHS ${fmt(totalMomoContributions)}`}
          description={`${momoContributionsResult.totalDocs} transactions`}
          icon={Smartphone}
        />
        <MetricCard
          title="Cash Contributions"
          value={`GHS ${fmt(totalCashContributions)}`}
          description={`${cashContributionsResult.totalDocs} transactions`}
          icon={Banknote}
        />
      </div>

      {/* Revenue & Balances */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Hogapay Revenue"
          value={`GHS ${fmt(platformRevenue)}`}
          description="0.8% collections + 0.5% transfers + refunds"
          icon={Receipt}
          valueClassName="text-green-400"
        />
        <MetricCard
          title="Total Jar Balances"
          value={`GHS ${fmt(totalJarBalances)}`}
          description="Across all jars"
          icon={Wallet}
        />
        <MetricCard
          title="Upcoming Balances"
          value={`GHS ${fmt(totalUpcomingBalances)}`}
          description="Unsettled mobile money"
          icon={Clock}
          valueClassName="text-amber-600"
        />
        <MetricCard
          title="Avg Transaction Size"
          value={`GHS ${fmt(avgTransactionSize)}`}
          description={`Across ${totalCompleted} contributions`}
          icon={BarChart3}
        />
      </div>

      {/* Transaction Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Transactions"
          value={totalTransactionCount.totalDocs.toLocaleString()}
          icon={ArrowLeftRight}
        />
        <MetricCard
          title="Completed"
          value={completedTotal.toLocaleString()}
          description={`${successRate.toFixed(1)}% success rate`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Pending"
          value={pendingCount.totalDocs.toLocaleString()}
          description="Awaiting confirmation"
          icon={Clock}
        />
        <MetricCard
          title="Failed"
          value={failedCount.totalDocs.toLocaleString()}
          description="Unsuccessful transactions"
          icon={XCircle}
        />
      </div>

      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing data for charts below</p>
        <Suspense>
          <TimeRangeSelector range={range} />
        </Suspense>
      </div>

      {/* Revenue Trend + User Growth — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueTrendChart data={revenueTrendData} range={range} />
        <UserGrowthChart data={userGrowthData} range={range} />
      </div>

      {/* Contribution Volume + by Payment Method — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <ContributionVolumeChart data={contributionVolumeData} range={range} />
        <ContributionVolumeByMethodChart data={contributionVolumeByMethodData} range={range} />
      </div>

      {/* New Jars + Failed Transactions trends — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <NewJarsTrendChart data={newJarsTrendData} range={range} />
        <FailedTransactionsTrendChart data={failedTransactionsTrendData} range={range} />
      </div>

      {/* Payout Volume + Refund Volume trends — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <PayoutVolumeTrendChart data={payoutVolumeTrendData} range={range} />
        <RefundVolumeTrendChart data={refundVolumeTrendData} range={range} />
      </div>

      {/* Payment Methods + Transaction Status — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <PaymentMethodChart data={paymentMethodData} />
        <TransactionStatusChart data={transactionStatusData} />
      </div>

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

      {/* Provider Split + Revenue Breakdown — 2 columns */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProviderSplitChart data={providerSplitData} />
        <RevenueBreakdownChart data={revenueBreakdownData} />
      </div>

      {/* Collector Performance — full width */}
      <CollectorPerformanceChart data={collectorPerformanceData} />
    </div>
  )
}

// --- Helper functions ---

function buildBuckets(range: Range): Record<string, number> {
  const buckets: Record<string, number> = {}
  if (range === 'yearly') {
    for (let i = 4; i >= 0; i--) {
      buckets[String(new Date().getFullYear() - i)] = 0
    }
  } else if (range === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      buckets[d.toISOString().split('T')[0]] = 0
    }
  }
  return buckets
}

function dateKey(createdAt: string, range: Range): string {
  const d = new Date(createdAt)
  if (range === 'yearly') return String(d.getFullYear())
  if (range === 'monthly')
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return d.toISOString().split('T')[0]
}

function buildRevenueTrendData(
  docs: { chargesBreakdown?: { hogapayRevenue?: number }; createdAt: string }[],
  refundDocs: { hogapayRevenue?: number; createdAt: string }[],
  range: Range = 'daily',
) {
  const buckets = buildBuckets(range)

  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += Math.abs(doc.chargesBreakdown?.hogapayRevenue || 0)
  }
  for (const doc of refundDocs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += Math.abs(doc.hogapayRevenue || 0)
  }

  return Object.entries(buckets).map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2)),
  }))
}

function buildUserGrowthData(
  recentDocs: { createdAt: string }[],
  baselineCount: number,
  range: Range = 'daily',
) {
  const buckets = buildBuckets(range)

  for (const doc of recentDocs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += 1
  }

  // Convert to cumulative
  let cumulative = baselineCount
  return Object.entries(buckets).map(([date, count]) => {
    cumulative += count
    return { date, totalUsers: cumulative }
  })
}

function buildContributionVolumeData(docs: { amountContributed?: number; createdAt: string }[], range: Range = 'daily') {
  const buckets = buildBuckets(range)

  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += doc.amountContributed || 0
  }

  return Object.entries(buckets).map(([date, amount]) => ({
    date,
    amount: Number(amount.toFixed(2)),
  }))
}

function buildTopContributorsData(docs: { amountContributed?: number; contributor?: string; contributorPhoneNumber?: string }[]) {
  const totals: Record<string, { name: string; amount: number }> = {}

  for (const doc of docs) {
    const name = doc.contributor || 'Anonymous'
    const phone = doc.contributorPhoneNumber || ''
    const key = phone || name
    if (!totals[key]) {
      const label = phone ? `${name} (${phone})` : name
      totals[key] = { name: label, amount: 0 }
    }
    totals[key].amount += doc.amountContributed || 0
  }

  return Object.values(totals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((entry) => ({
      name: entry.name.length > 25 ? entry.name.slice(0, 25) + '…' : entry.name,
      amount: Number(entry.amount.toFixed(2)),
    }))
}

function buildContributionVolumeByMethodData(
  docs: { amountContributed?: number; createdAt: string; paymentMethod?: string }[],
  range: Range = 'daily',
) {
  const rawBuckets = buildBuckets(range)
  const buckets: Record<string, { mobileMoney: number; cash: number; bank: number; card: number }> = {}
  for (const key of Object.keys(rawBuckets)) {
    buckets[key] = { mobileMoney: 0, cash: 0, bank: 0, card: 0 }
  }

  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (!(key in buckets)) continue
    const amount = doc.amountContributed || 0
    const method = doc.paymentMethod || ''
    if (method === 'mobile-money') buckets[key].mobileMoney += amount
    else if (method === 'cash') buckets[key].cash += amount
    else if (method === 'bank') buckets[key].bank += amount
    else if (method === 'card' || method === 'apple-pay') buckets[key].card += amount
  }

  return Object.entries(buckets).map(([date, amounts]) => ({
    date,
    mobileMoney: Number(amounts.mobileMoney.toFixed(2)),
    cash: Number(amounts.cash.toFixed(2)),
    bank: Number(amounts.bank.toFixed(2)),
    card: Number(amounts.card.toFixed(2)),
  }))
}

function buildCountTrendData(docs: { createdAt: string }[], range: Range = 'daily') {
  const buckets = buildBuckets(range)
  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += 1
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }))
}

function buildAmountTrendData(docs: { amountContributed?: number; createdAt: string }[], range: Range = 'daily') {
  const buckets = buildBuckets(range)
  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += Math.abs(doc.amountContributed || 0)
  }
  return Object.entries(buckets).map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
}

function buildRefundVolumeTrendData(docs: { amount?: number; createdAt: string }[], range: Range = 'daily') {
  const buckets = buildBuckets(range)
  for (const doc of docs) {
    const key = dateKey(doc.createdAt, range)
    if (key in buckets) buckets[key] += Math.abs(doc.amount || 0)
  }
  return Object.entries(buckets).map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
}

function buildCollectorPerformanceData(docs: { amountContributed?: number; jar?: any }[]) {
  const totals: Record<string, { name: string; amount: number; count: number }> = {}

  for (const doc of docs) {
    const jar = typeof doc.jar === 'object' && doc.jar ? doc.jar : null
    if (!jar) continue
    const createdBy = typeof jar.creator === 'object' && jar.creator ? jar.creator : null
    const creatorId = createdBy ? String(createdBy.id) : String(jar.id)
    if (!totals[creatorId]) {
      const firstName = createdBy?.firstName || ''
      const lastName = createdBy?.lastName || ''
      const phone = createdBy?.phoneNumber || ''
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || phone || 'Unknown'
      totals[creatorId] = { name: fullName.length > 20 ? fullName.slice(0, 20) + '…' : fullName, amount: 0, count: 0 }
    }
    totals[creatorId].amount += doc.amountContributed || 0
    totals[creatorId].count += 1
  }

  return Object.values(totals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((e) => ({ name: e.name, amount: Number(e.amount.toFixed(2)), count: e.count }))
}

function buildTopJarsData(docs: { amountContributed?: number; jar?: any }[]) {
  const jarTotals: Record<string, { id: string; name: string; amount: number }> = {}

  for (const doc of docs) {
    const jarObj = typeof doc.jar === 'object' && doc.jar ? doc.jar : null
    if (!jarObj) continue
    const jarId = jarObj.id as string
    if (!jarTotals[jarId]) {
      const name = (jarObj.name as string) || 'Unknown'
      jarTotals[jarId] = { id: jarId, name: name.length > 20 ? name.slice(0, 20) + '…' : name, amount: 0 }
    }
    jarTotals[jarId].amount += doc.amountContributed || 0
  }

  return Object.values(jarTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map((j) => ({ id: j.id, name: j.name, amount: Number(j.amount.toFixed(2)) }))
}
