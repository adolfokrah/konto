import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Snowflake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/ui'
import { JarActions } from '@/components/dashboard/jar-actions'

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  sealed: 'bg-blue-100 text-blue-800 border-blue-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
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
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!jar) notFound()

  // Compute contribution total from transactions
  const contributions = await payload.find({
    collection: 'transactions',
    where: {
      jar: { equals: id },
      paymentStatus: { equals: 'completed' },
      type: { equals: 'contribution' },
    },
    pagination: false,
    select: { amountContributed: true },
    overrideAccess: true,
  })

  const totalContributions = contributions.docs.reduce(
    (sum, tx: any) => sum + (tx.amountContributed || 0),
    0,
  )

  const creatorObj = typeof jar.creator === 'object' && jar.creator ? jar.creator : null
  const creatorName = creatorObj
    ? `${creatorObj.firstName || ''} ${creatorObj.lastName || ''}`.trim() || creatorObj.email || 'Unknown'
    : 'Unknown'
  const creatorEmail = creatorObj?.email || '—'
  const currency = jar.currency || 'GHS'
  const goalAmount = jar.goalAmount || 0
  const progress = goalAmount > 0 ? Math.min((totalContributions / goalAmount) * 100, 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jars"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jars
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{jar.name}</h1>
            <Badge variant="outline" className={cn('capitalize', statusStyles[jar.status])}>
              {jar.status}
            </Badge>
          </div>
          {jar.description && (
            <p className="text-sm text-muted-foreground">{jar.description}</p>
          )}
        </div>
        <JarActions jarId={jar.id} status={jar.status} />
      </div>

      {/* Frozen Banner */}
      {jar.status === 'frozen' && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-950/30 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-400">
            <Snowflake className="h-4 w-4" />
            This jar is frozen (AML compliance)
          </div>
          {jar.freezeReason && (
            <p className="mt-1 text-sm text-cyan-300">{jar.freezeReason}</p>
          )}
        </div>
      )}

      {/* Image */}
      {typeof jar.image === 'object' && jar.image?.url && (
        <div className="overflow-hidden rounded-lg">
          <img
            src={jar.image.url}
            alt={jar.name}
            className="h-64 w-full object-cover"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {goalAmount > 0 && (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{formatAmount(totalContributions, currency)}</span>
                  <span>{formatAmount(goalAmount, currency)}</span>
                </div>
              </div>
            )}
            <DetailRow
              label="Total Contributions"
              value={formatAmount(totalContributions, currency)}
            />
            <DetailRow
              label="Goal Amount"
              value={goalAmount > 0 ? formatAmount(goalAmount, currency) : '—'}
            />
            {jar.isFixedContribution && jar.acceptedContributionAmount && (
              <DetailRow
                label="Fixed Amount"
                value={formatAmount(jar.acceptedContributionAmount, currency)}
              />
            )}
            <DetailRow label="Currency" value={currency.toUpperCase()} />
          </CardContent>
        </Card>

        {/* People */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailRow label="Creator" value={creatorName} />
            <DetailRow label="Email" value={creatorEmail} />
            <DetailRow label="Contributors" value={jar.invitedCollectors?.length || 0} />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailRow label="Active" value={jar.isActive ? 'Yes' : 'No'} />
            <DetailRow
              label="Fixed Contribution"
              value={jar.isFixedContribution ? 'Yes' : 'No'}
            />
            <DetailRow
              label="Anonymous Allowed"
              value={jar.allowAnonymousContributions ? 'Yes' : 'No'}
            />
            {jar.deadline && (
              <DetailRow label="Deadline" value={formatDate(jar.deadline)} />
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailRow label="Created" value={formatDate(jar.createdAt)} />
            <DetailRow
              label="Jar ID"
              value={<span className="font-mono text-xs">{jar.id}</span>}
            />
            {jar.thankYouMessage && (
              <>
                <Separator className="my-2" />
                <div>
                  <span className="text-sm text-muted-foreground">Thank You Message</span>
                  <p className="mt-1 text-sm">{jar.thankYouMessage}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
