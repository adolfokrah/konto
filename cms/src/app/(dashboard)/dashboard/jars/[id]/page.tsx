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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/utilities/ui'
import { JarActions } from '@/components/dashboard/jar-actions'

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  sealed: 'bg-blue-100 text-blue-800 border-blue-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

const collectorStatusStyles: Record<string, string> = {
  accepted: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

type Props = {
  params: Promise<{ id: string }>
}

export default async function JarDetailPage({ params }: Props) {
  const { id } = await params
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

  // Compute contribution total and fetch recent transactions in parallel
  const [contributionsResult, recentTransactions] = await Promise.all([
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
      where: {
        jar: { equals: id },
      },
      sort: '-createdAt',
      limit: 10,
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectors.map((collector: any) => (
                  <TableRow key={collector.id}>
                    <TableCell className="font-medium">{collector.name}</TableCell>
                    <TableCell className="text-muted-foreground">{collector.email}</TableCell>
                    <TableCell className="text-muted-foreground">{collector.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', collectorStatusStyles[collector.status])}
                      >
                        {collector.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.docs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No transactions yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.docs.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.contributor || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {tx.paymentMethod?.replace('-', ' ') || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          tx.paymentStatus === 'completed' && 'bg-green-100 text-green-800 border-green-200',
                          tx.paymentStatus === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          tx.paymentStatus === 'failed' && 'bg-red-100 text-red-800 border-red-200',
                          tx.paymentStatus === 'transferred' && 'bg-blue-100 text-blue-800 border-blue-200',
                        )}
                      >
                        {tx.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(Math.abs(tx.amountContributed || 0), currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(tx.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
