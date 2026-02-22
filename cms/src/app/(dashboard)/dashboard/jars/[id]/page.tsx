import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Snowflake,
  Calendar,
  Clock,
  UserCircle,
  Mail,
  DollarSign,
  Target,
  Users,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/ui'
import { JarActions } from '@/components/dashboard/jar-actions'
import { TransactionsDataTable } from '@/components/dashboard/transactions-data-table'
import { type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'
import { CollectorsDataTable } from '@/components/dashboard/collectors-data-table'

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  sealed: 'bg-blue-100 text-blue-800 border-blue-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

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
  if (txStatus && ['pending', 'completed', 'failed', 'transferred'].includes(txStatus)) {
    txWhere.paymentStatus = { equals: txStatus }
  }
  if (txType && ['contribution', 'payout'].includes(txType)) {
    txWhere.type = { equals: txType }
  }
  if (txMethod && ['mobile-money', 'cash', 'bank', 'card', 'apple-pay'].includes(txMethod)) {
    txWhere.paymentMethod = { equals: txMethod }
  }
  if (txLink && ['yes', 'no'].includes(txLink)) {
    txWhere.viaPaymentLink = { equals: txLink === 'yes' }
  }
  if (txSettled && ['yes', 'no'].includes(txSettled)) {
    txWhere.isSettled = { equals: txSettled === 'yes' }
  }

  // Compute contribution total and fetch filtered transactions in parallel
  const [contributionsResult, transactionsResult] = await Promise.all([
    payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: id },
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true },
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

  const totalContributions = contributionsResult.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

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

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/jars"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jars
      </Link>

      {/* Hero: Image + Header overlay */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        {typeof jar.image === 'object' && jar.image?.url ? (
          <div className="relative">
            <img
              src={jar.image.url}
              alt={jar.name}
              className="w-full max-h-[400px] object-contain bg-black/5"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-white">{jar.name}</h1>
                    <Badge
                      variant="outline"
                      className={cn('capitalize border-white/20', statusStyles[jar.status])}
                    >
                      {jar.status}
                    </Badge>
                  </div>
                  {jar.description && (
                    <p className="text-sm text-white/80 max-w-2xl">{jar.description}</p>
                  )}
                </div>
                <JarActions jarId={jar.id} status={jar.status} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{jar.name}</h1>
                  <Badge variant="outline" className={cn('capitalize', statusStyles[jar.status])}>
                    {jar.status}
                  </Badge>
                </div>
                {jar.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">{jar.description}</p>
                )}
              </div>
              <JarActions jarId={jar.id} status={jar.status} />
            </div>
          </div>
        )}
      </div>

      {/* Frozen Banner */}
      {jar.status === 'frozen' && (
        <div className="rounded-lg border border-cyan-800/50 bg-cyan-950/40 p-4">
          <div className="flex items-center gap-2 font-medium text-cyan-400">
            <Snowflake className="h-5 w-5" />
            This jar is frozen for AML compliance
          </div>
          {jar.freezeReason && (
            <p className="mt-2 text-sm text-cyan-300/80 pl-7">{jar.freezeReason}</p>
          )}
        </div>
      )}

      {/* Progress Bar (if goal is set) */}
      {goalAmount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {formatAmount(totalContributions, currency)} raised
              </span>
              <span className="text-sm text-muted-foreground">
                Goal: {formatAmount(goalAmount, currency)}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className={cn(
                  'h-3 rounded-full transition-all',
                  progress >= 100 ? 'bg-green-500' : 'bg-primary',
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 text-right text-sm font-medium text-muted-foreground">
              {progress.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial — spans 1 col */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Total Contributions"
              value={formatAmount(totalContributions, currency)}
            />
            <Separator />
            <DetailRow
              label="Goal Amount"
              icon={Target}
              value={goalAmount > 0 ? formatAmount(goalAmount, currency) : 'No goal set'}
            />
            <Separator />
            {jar.isFixedContribution && (
              <>
                <DetailRow
                  label="Fixed Amount"
                  value={
                    jar.acceptedContributionAmount
                      ? formatAmount(jar.acceptedContributionAmount, currency)
                      : '—'
                  }
                />
                <Separator />
              </>
            )}
            <DetailRow label="Currency" value={currency.toUpperCase()} />
          </CardContent>
        </Card>

        {/* Creator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCircle className="h-4 w-4" />
              Creator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Name" icon={UserCircle} value={creatorName} />
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
            <DetailRow
              label="Fixed Contribution"
              value={jar.isFixedContribution ? 'Yes' : 'No'}
            />
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
            <Separator />
            <DetailRow
              label="Jar ID"
              value={<span className="font-mono text-xs">{jar.id}</span>}
            />
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
            {transactionsResult.totalDocs} transaction{transactionsResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsDataTable
            transactions={transactions}
            pagination={{ currentPage: txPage, totalPages: transactionsResult.totalPages, totalRows: transactionsResult.totalDocs, rowsPerPage: txLimit }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
