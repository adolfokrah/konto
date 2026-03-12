import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowLeftRight, Container, CreditCard, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/ui'
import { DisputeStatusForm } from '@/components/dashboard/dispute-status-form'

const statusStyles: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-300 border-blue-700',
  'under-review': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  resolved: 'bg-green-900/40 text-green-300 border-green-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

const txStatusStyles: Record<string, string> = {
  completed: 'bg-green-900/40 text-green-300 border-green-700',
  pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

function Row({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  await payload.auth({ headers: requestHeaders })

  const result = await payload.findByID({
    collection: 'disputes' as any,
    id,
    depth: 3,
    overrideAccess: true,
  }).catch(() => null)

  if (!result) notFound()

  const d = result as any
  const raisedBy = typeof d.raisedBy === 'object' && d.raisedBy ? d.raisedBy : null
  const resolvedBy = typeof d.resolvedBy === 'object' && d.resolvedBy ? d.resolvedBy : null
  const tx = typeof d.transaction === 'object' && d.transaction ? d.transaction : null
  const jar = tx && typeof tx.jar === 'object' ? tx.jar : null
  const evidence: any[] = d.evidence ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard/disputes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Disputes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Dispute</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{d.id}</p>
        </div>
        <Badge variant="outline" className={cn('ml-2', statusStyles[d.status])}>
          {statusLabel[d.status] ?? d.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dispute Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Row
                label="Raised By"
                icon={<User className="h-3.5 w-3.5" />}
                value={
                  raisedBy ? (
                    <Link href={`/dashboard/users/${raisedBy.id}`} className="hover:underline">
                      {[raisedBy.firstName, raisedBy.lastName].filter(Boolean).join(' ') || raisedBy.email}
                    </Link>
                  ) : '—'
                }
              />
              <Row label="Date Raised" value={formatDate(d.createdAt)} />
              <Separator className="my-2" />
              <div className="pt-1">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{d.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          {evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evidence ({evidence.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {evidence.map((item: any, i: number) => {
                    const img = typeof item.image === 'object' ? item.image : null
                    const url = img?.url
                    if (!url) return null
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-28 h-28 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Transaction */}
          {tx && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Related Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Row
                  label="ID"
                  value={
                    <Link href={`/dashboard/transactions?id=${tx.id}`} className="font-mono text-xs hover:underline">
                      {tx.id}
                    </Link>
                  }
                />
                <Row
                  label="Contributor"
                  icon={<User className="h-3.5 w-3.5" />}
                  value={tx.contributor || '—'}
                />
                <Row
                  label="Jar"
                  icon={<Container className="h-3.5 w-3.5" />}
                  value={
                    jar ? (
                      <Link href={`/dashboard/jars/${jar.id}`} className="hover:underline">
                        {jar.name}
                      </Link>
                    ) : null
                  }
                />
                <Row
                  label="Amount"
                  value={
                    <span className="font-semibold">
                      GHS {Math.abs(tx.amountContributed ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  }
                />
                <Row
                  label="Payment Method"
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                  value={tx.paymentMethod || '—'}
                />
                <Row
                  label="Status"
                  value={
                    <Badge variant="outline" className={cn(txStatusStyles[tx.paymentStatus] ?? '')}>
                      {tx.paymentStatus}
                    </Badge>
                  }
                />
                <Row label="Date" value={tx.createdAt ? formatDate(tx.createdAt) : null} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — status management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <DisputeStatusForm
                disputeId={d.id}
                currentStatus={d.status}
                resolutionNote={d.resolutionNote ?? ''}
                resolvedBy={
                  resolvedBy
                    ? {
                        id: resolvedBy.id,
                        name: [resolvedBy.firstName, resolvedBy.lastName].filter(Boolean).join(' ') || resolvedBy.email,
                      }
                    : null
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
