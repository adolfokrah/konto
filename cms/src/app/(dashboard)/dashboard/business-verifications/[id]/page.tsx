import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, FileText, User, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BusinessVerificationStatusBadge } from '@/components/dashboard/business-verification-status-badge'
import { BusinessVerificationStatusForm } from '@/components/dashboard/business-verification-status-form'

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  'under-review': 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

function Row({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
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

function DocLink({ doc, label }: { doc: any; label: string }) {
  const file = typeof doc === 'object' && doc ? doc : null
  const url = file?.url
  if (!url) return <span className="text-muted-foreground">—</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:underline"
    >
      <FileText className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

export default async function BusinessVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  await payload.auth({ headers: requestHeaders })

  const result = await payload
    .findByID({
      collection: 'business-verifications' as any,
      id,
      depth: 3,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!result) notFound()

  const d = result as any
  const user = typeof d.user === 'object' && d.user ? d.user : null
  const reviewedBy = typeof d.reviewedBy === 'object' && d.reviewedBy ? d.reviewedBy : null
  const directors: any[] = Array.isArray(d.directors) ? d.directors : []
  const statusHistory: any[] = Array.isArray(d.statusHistory) ? d.statusHistory : []

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard/business-verifications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Business Verifications
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">{d.businessName || 'Business Verification'}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{d.id}</p>
        </div>
        <BusinessVerificationStatusBadge status={d.status} className="ml-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Business Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Row
                label="Business Name"
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={d.businessName || '—'}
              />
              <Row
                label="Submitted By"
                icon={<User className="h-3.5 w-3.5" />}
                value={
                  user ? (
                    <Link href={`/dashboard/users/${user.id}`} className="hover:underline">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
              <Row label="Date Submitted" value={formatDate(d.createdAt)} />
              <Separator className="my-2" />
              <div className="pt-1 space-y-2">
                <p className="text-xs text-muted-foreground mb-1">Documents</p>
                <div className="flex flex-col gap-2">
                  <DocLink doc={d.companyRegistrationDoc} label="Company Registration Document" />
                  <DocLink doc={d.proofOfBusinessAddress} label="Proof of Business Address" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directors */}
          {directors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Directors ({directors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {directors.map((dir: any, i: number) => (
                  <div key={dir.id ?? i}>
                    {i > 0 && <Separator className="mb-4" />}
                    <p className="text-sm font-medium mb-2">{dir.fullName || `Director ${i + 1}`}</p>
                    <div className="flex flex-col gap-2">
                      <DocLink doc={dir.idDocument} label="ID Document (Front)" />
                      {dir.idDocumentBack && (
                        <DocLink doc={dir.idDocumentBack} label="ID Document (Back)" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          {statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Status History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusHistory
                  .slice()
                  .reverse()
                  .map((h: any, i: number) => {
                    const changedBy =
                      typeof h.changedBy === 'object' && h.changedBy ? h.changedBy : null
                    return (
                      <div key={h.id ?? i} className="text-sm">
                        {i > 0 && <Separator className="mb-3" />}
                        <div className="flex items-center gap-2">
                          {h.from && (
                            <>
                              <BusinessVerificationStatusBadge status={h.from} />
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <BusinessVerificationStatusBadge status={h.to} />
                        </div>
                        {h.reason && (
                          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
                            {h.reason}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {changedBy
                            ? [changedBy.firstName, changedBy.lastName]
                                .filter(Boolean)
                                .join(' ') || changedBy.email
                            : 'System'}
                          {h.changedAt ? ` • ${formatDate(h.changedAt)}` : ''}
                        </p>
                      </div>
                    )
                  })}
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
              <BusinessVerificationStatusForm
                verificationId={d.id}
                currentStatus={d.status}
                rejectionReason={d.rejectionReason ?? ''}
                reviewedBy={
                  reviewedBy
                    ? {
                        id: reviewedBy.id,
                        name:
                          [reviewedBy.firstName, reviewedBy.lastName].filter(Boolean).join(' ') ||
                          reviewedBy.email,
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
