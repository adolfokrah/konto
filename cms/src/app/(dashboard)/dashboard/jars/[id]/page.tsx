import { MetricCard } from '@/components/dashboard/metric-card'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Snowflake,
  Calendar,
  Clock,
  UserCircle,
  Mail,
  Target,
  Users,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertCircle,
  Banknote,
  Smartphone,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/ui'
import { JarActions } from '@/components/dashboard/jar-actions'
import { TransactionsDataTable } from '@/components/dashboard/transactions-data-table'
import { type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'
import { CollectorsDataTable } from '@/components/dashboard/collectors-data-table'
import { getJarBalance } from '@/utilities/getJarBalance'

const jarStatusVariant: Record<string, 'pos' | 'info' | 'gray' | 'neg'> = {
  open: 'pos',
  frozen: 'info',
  sealed: 'gray',
  broken: 'neg',
}

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 })

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

const TX_DEFAULT_LIMIT = 20

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JarDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const txPage = Number(sp.page) || 1
  const txLimit = Number(sp.limit) || TX_DEFAULT_LIMIT
  const txSearch = typeof sp.search === 'string' ? sp.search : ''
  const txStatus = typeof sp.status === 'string' ? sp.status : ''
  const txType = typeof sp.type === 'string' ? sp.type : ''
  const txMethod = typeof sp.method === 'string' ? sp.method : ''
  const txLink = typeof sp.link === 'string' ? sp.link : ''
  const txSettled = typeof sp.settled === 'string' ? sp.settled : ''
  const txFrom = typeof sp.from === 'string' ? sp.from : ''
  const txTo = typeof sp.to === 'string' ? sp.to : ''

  const payload = await getPayload({ config: configPromise })

  let jar: any
  try {
    jar = await payload.findByID({
      collection: 'jars',
      id,
      depth: 2,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!jar) notFound()

  // Build transaction filter where clause (always scoped to this jar)
  const txWhere: Record<string, any> = { jar: { equals: id } }
  if (txSearch) {
    txWhere.contributor = { like: txSearch }
  }
  if (txStatus) {
    const valid = ['pending', 'completed', 'failed']
    const values = txStatus.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) txWhere.paymentStatus = { equals: values[0] }
    else if (values.length > 1) txWhere.paymentStatus = { in: values }
  }
  if (txType) {
    const valid = ['contribution', 'payout']
    const values = txType.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) txWhere.type = { equals: values[0] }
    else if (values.length > 1) txWhere.type = { in: values }
  }
  if (txMethod) {
    const valid = ['mobile-money', 'cash', 'bank', 'card', 'apple-pay']
    const values = txMethod.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) txWhere.paymentMethod = { equals: values[0] }
    else if (values.length > 1) txWhere.paymentMethod = { in: values }
  }
  if (txLink && ['yes', 'no'].includes(txLink)) {
    txWhere.viaPaymentLink = { equals: txLink === 'yes' }
  }
  if (txSettled && ['yes', 'no'].includes(txSettled)) {
    txWhere.isSettled = { equals: txSettled === 'yes' }
  }
  if (txFrom) {
    txWhere.createdAt = { ...txWhere.createdAt, greater_than_equal: new Date(txFrom).toISOString() }
  }
  if (txTo) {
    const toDate = new Date(txTo)
    toDate.setHours(23, 59, 59, 999)
    txWhere.createdAt = { ...txWhere.createdAt, less_than_equal: toDate.toISOString() }
  }

  // Compute contribution total, balance, upcoming balance, and fetch filtered transactions in parallel
  const [reportCount, { balance }, allJarTransactions, transactionsResult] = await Promise.all([
    payload.count({
      collection: 'jar-reports',
      where: { jar: { equals: id } },
      overrideAccess: true,
    }),
    getJarBalance(payload, id),
    payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: id },
        paymentStatus: { in: ['completed', 'pending', 'awaiting-approval'] },
      },
      pagination: false,
      select: {
        amountContributed: true,
        type: true,
        isSettled: true,
        paymentMethod: true,
        paymentStatus: true,
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'transactions',
      where: txWhere,
      page: txPage,
      limit: txLimit,
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    }),
  ])

  let totalContributions = 0
  let upcomingBalance = 0
  let totalPayouts = 0
  let cashContributions = 0
  let mobileMoneyContributions = 0
  for (const tx of allJarTransactions.docs as any[]) {
    if (tx.type === 'contribution' && tx.paymentStatus === 'completed') {
      totalContributions += tx.amountContributed || 0
      if (tx.paymentMethod === 'cash') {
        cashContributions += tx.amountContributed || 0
      } else if (tx.paymentMethod === 'mobile-money') {
        mobileMoneyContributions += tx.amountContributed || 0
        if (!tx.isSettled) {
          upcomingBalance += tx.amountContributed || 0
        }
      }
    } else if (tx.type === 'payout') {
      totalPayouts += tx.amountContributed || 0
    }
  }
  const totalWithdrawn = Math.abs(totalPayouts)

  const creatorObj = typeof jar.creator === 'object' && jar.creator ? jar.creator : null
  const creatorName = creatorObj
    ? `${creatorObj.firstName || ''} ${creatorObj.lastName || ''}`.trim() ||
      creatorObj.email ||
      'Unknown'
    : 'Unknown'
  const creatorEmail = creatorObj?.email || '—'
  const currency = jar.currency || 'GHS'
  const goalAmount = jar.goalAmount || 0
  const progress = goalAmount > 0 ? Math.min((totalContributions / goalAmount) * 100, 100) : 0

  // Parse collectors
  const collectors = (jar.invitedCollectors || []).map((ic: any) => {
    const user = typeof ic.collector === 'object' && ic.collector ? ic.collector : null
    return {
      id: user?.id || ic.collector,
      name: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown'
        : 'Unknown',
      email: user?.email || '—',
      phone: user?.phoneNumber || '—',
      status: ic.status || 'pending',
      role: ic.role || 'member',
    }
  })

  const acceptedCount = collectors.filter((c: any) => c.status === 'accepted').length
  const pendingCount = collectors.filter((c: any) => c.status === 'pending').length

  // Map transactions to TransactionRow type
  const transactions: TransactionRow[] = transactionsResult.docs.map((tx: any) => {
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

  // Short link when the jar has one (it redirects to the full pay page).
  const contributionPageUrl = jar.shortCode
    ? `/j/${jar.shortCode}`
    : `/pay/${jar.id}/${encodeURIComponent(jar.name.toLowerCase().replace(/\s+/g, '-'))}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {typeof jar.image === 'object' && jar.image?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={jar.image.url}
              alt=""
              className="h-[60px] w-[60px] shrink-0 rounded-[14px] object-cover"
            />
          ) : (
            <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[14px] bg-card text-xl font-semibold">
              {jar.name?.[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-chillax text-[26px] font-semibold leading-tight tracking-tight">
                {jar.name}
              </h1>
              <Badge variant={jarStatusVariant[jar.status] ?? 'gray'} className="capitalize">
                {jar.status}
              </Badge>
              {reportCount.totalDocs > 0 && (
                <Link href={`/dashboard/jar-reports?search=${encodeURIComponent(jar.name)}`}>
                  <Badge variant="warn">
                    <AlertTriangle className="h-3 w-3" />
                    {reportCount.totalDocs} {reportCount.totalDocs === 1 ? 'report' : 'reports'}
                  </Badge>
                </Link>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Created by{' '}
              {creatorObj ? (
                <Link href={`/dashboard/users/${creatorObj.id}`} className="hover:underline">
                  {creatorName}
                </Link>
              ) : (
                creatorName
              )}
              {' · '}
              {new Date(jar.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' · '}
              {currency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={contributionPageUrl}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-[13.5px] font-semibold transition-colors hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
            View contribution page
          </Link>
          <JarActions jarId={jar.id} status={jar.status} />
        </div>
      </div>

      {jar.description && (
        <p className="max-w-3xl text-[13.5px] text-muted-foreground">{jar.description}</p>
      )}

      {/* Frozen banner */}
      {jar.status === 'frozen' && (
        <div className="rounded-2xl bg-[#EAF2FF] p-4">
          <div className="flex items-center gap-2 font-semibold text-[#2E7CF6]">
            <Snowflake className="h-5 w-5" />
            This jar is frozen for AML compliance
          </div>
          {jar.freezeReason && (
            <p className="mt-1.5 pl-7 text-[13px] text-[#1B232E]">{jar.freezeReason}</p>
          )}
        </div>
      )}

      {/* Goal */}
      {goalAmount > 0 && (
        <div className="rounded-2xl bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-chillax text-[15px] font-semibold">Goal</span>
            <span className="text-[12px] text-muted-foreground">
              {totalContributions.toLocaleString()} of {goalAmount.toLocaleString()}
              {jar.deadline &&
                ` · ends ${new Date(jar.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                progress >= 100 ? 'bg-[#0F9F61]' : 'bg-[#1B232E]',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Money */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard title="Jar balance" value={money(balance)} />
        <MetricCard title="Upcoming" value={money(upcomingBalance)} />
        <MetricCard title="Total withdrawn" value={money(totalWithdrawn)} />
        <MetricCard title="Mobile money" value={money(mobileMoneyContributions)} />
        <MetricCard title="Cash" value={money(cashContributions)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Creator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="h-4 w-4" />
              Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Name"
              icon={UserCircle}
              value={
                creatorObj ? (
                  <Link href={`/dashboard/users/${creatorObj.id}`} className="hover:underline">
                    {creatorName}
                  </Link>
                ) : (
                  creatorName
                )
              }
            />
            <Separator />
            <DetailRow label="Email" icon={Mail} value={creatorEmail} />
            <Separator />
            <DetailRow label="Created" icon={Calendar} value={formatDate(jar.createdAt)} />
            {jar.updatedAt && (
              <>
                <Separator />
                <DetailRow label="Updated" icon={Clock} value={formatDate(jar.updatedAt)} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Active"
              value={
                jar.isActive ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    No
                  </Badge>
                )
              }
            />
            <Separator />
            <DetailRow label="Fixed Contribution" value={jar.isFixedContribution ? 'Yes' : 'No'} />
            <Separator />
            <DetailRow
              label="Anonymous Contributions"
              value={jar.allowAnonymousContributions ? 'Allowed' : 'Not allowed'}
            />
            {jar.deadline && (
              <>
                <Separator />
                <DetailRow label="Deadline" icon={Calendar} value={formatDate(jar.deadline)} />
              </>
            )}
            {jar.lastActivityAt && (
              <>
                <Separator />
                <DetailRow
                  label="Last Activity"
                  icon={Clock}
                  value={formatDate(jar.lastActivityAt)}
                />
              </>
            )}
            <Separator />
            <DetailRow label="Jar ID" value={<span className="font-mono text-xs">{jar.id}</span>} />
          </CardContent>
        </Card>
      </div>

      {/* Thank You Message */}
      {jar.thankYouMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Thank You Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{jar.thankYouMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Collectors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Collectors
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                {acceptedCount} accepted
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                {pendingCount} pending
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No collectors invited yet
            </p>
          ) : (
            <CollectorsDataTable collectors={collectors} />
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transactions</CardTitle>
          <CardDescription>
            {transactionsResult.totalDocs} transaction
            {transactionsResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsDataTable
            transactions={transactions}
            pagination={{
              currentPage: txPage,
              totalPages: transactionsResult.totalPages,
              totalRows: transactionsResult.totalDocs,
              rowsPerPage: txLimit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
