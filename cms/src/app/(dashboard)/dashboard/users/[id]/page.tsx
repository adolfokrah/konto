import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utilities/ui'
import { kycStatusLabels } from '@/components/dashboard/table-constants'
import { createDiditKYC, type DiditSessionDecision } from '@/utilities/diditKyc'
import { UserKycActions } from '@/components/dashboard/user-kyc-actions'
import { TransactionsDataTable } from '@/components/dashboard/transactions-data-table'

type Props = {
  params: Promise<{ id: string }>
}

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number, currency: string = 'GHS') {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  // Fetch user
  let user: any
  try {
    user = await payload.findByID({
      collection: 'users',
      id,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!user) notFound()

  // Fetch user's jars (created by user) and jars where user is invited collector, plus transactions in parallel
  const [createdJarsResult, collectorJarsResult, transactionsResult] = await Promise.all([
    payload.find({
      collection: 'jars',
      where: { creator: { equals: id } },
      sort: '-createdAt',
      limit: 50,
      depth: 0,
      overrideAccess: true,
      select: {
        name: true,
        status: true,
        goalAmount: true,
        currency: true,
        createdAt: true,
      },
    }),
    payload.find({
      collection: 'jars',
      where: { 'invitedCollectors.collector': { equals: id } },
      sort: '-createdAt',
      limit: 50,
      depth: 0,
      overrideAccess: true,
      select: {
        name: true,
        status: true,
        goalAmount: true,
        currency: true,
        createdAt: true,
      },
    }),
    payload.find({
      collection: 'transactions',
      where: {
        or: [
          { collector: { equals: id } },
          { contributorPhoneNumber: { equals: user.phoneNumber } },
        ],
      },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  // Fetch Didit KYC decision if session exists
  let diditDecision: DiditSessionDecision | null = null
  if (user.kycSessionId) {
    try {
      const didit = createDiditKYC()
      diditDecision = await didit.getSessionDecision(user.kycSessionId)
    } catch {
      // Decision fetch failed — will show as unavailable
    }
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const photoUrl = typeof user.photo === 'object' && user.photo?.url ? user.photo.url : null

  // Map transactions for the data table
  const transactions = transactionsResult.docs.map((tx: any) => ({
    id: tx.id,
    contributor: tx.contributor || null,
    contributorPhoneNumber: tx.contributorPhoneNumber || null,
    jar: typeof tx.jar === 'object' && tx.jar ? { id: tx.jar.id, name: tx.jar.name } : null,
    paymentMethod: tx.paymentMethod || null,
    mobileMoneyProvider: tx.mobileMoneyProvider || null,
    accountNumber: tx.accountNumber || null,
    amountContributed: tx.amountContributed || 0,
    chargesBreakdown: tx.chargesBreakdown || null,
    paymentStatus: tx.paymentStatus || 'pending',
    type: tx.type || 'contribution',
    isSettled: tx.isSettled ?? false,
    payoutFeePercentage: tx.payoutFeePercentage || null,
    payoutFeeAmount: tx.payoutFeeAmount || null,
    payoutNetAmount: tx.payoutNetAmount || null,
    transactionReference: tx.transactionReference || null,
    collector: typeof tx.collector === 'object' && tx.collector
      ? { id: tx.collector.id, firstName: tx.collector.firstName, lastName: tx.collector.lastName, email: tx.collector.email }
      : null,
    viaPaymentLink: tx.viaPaymentLink ?? false,
    createdAt: tx.createdAt,
  }))

  const idVerification = diditDecision?.id_verifications?.[0]
  const livenessCheck = diditDecision?.liveness_checks?.[0]
  const faceMatch = diditDecision?.face_matches?.[0]
  const amlScreening = diditDecision?.aml_screenings?.[0]
  const ipAnalysis = diditDecision?.ip_analyses?.[0]

  const jarStatusStyles: Record<string, string> = {
    open: 'bg-green-900/40 text-green-300 border-green-700',
    frozen: 'bg-blue-900/40 text-blue-300 border-blue-700',
    broken: 'bg-orange-900/40 text-orange-300 border-orange-700',
    sealed: 'bg-gray-900/40 text-gray-300 border-gray-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={fullName}
            className="h-14 w-14 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground">
            {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{fullName || 'Unknown User'}</h1>
            <Badge
              variant="outline"
              className={cn(
                user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200',
              )}
            >
              {user.role}
            </Badge>
            {user.demoUser && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                Demo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: User info + Withdrawal */}
        <div className="space-y-6 lg:col-span-1">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Name" value={fullName} />
              <InfoRow label="Username" value={user.username} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow
                label="Phone"
                value={`${user.countryCode || ''} ${user.phoneNumber}`}
              />
              <InfoRow label="Country" value={user.country} />
              <InfoRow label="Joined" value={formatFullDate(user.createdAt)} />
              <InfoRow label="ID" value={<span className="font-mono text-xs">{user.id}</span>} />
            </CardContent>
          </Card>

          {/* Withdrawal Account */}
          {(user.bank || user.accountNumber || user.accountHolder) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Withdrawal Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow label="Bank" value={user.bank} />
                <InfoRow label="Account Number" value={user.accountNumber} />
                <InfoRow label="Account Holder" value={user.accountHolder} />
              </CardContent>
            </Card>
          )}

          {/* App Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Language" value={user.appSettings?.language === 'fr' ? 'French' : 'English'} />
              <InfoRow label="Theme" value={user.appSettings?.theme || 'system'} />
              <InfoRow label="Biometric Auth" value={user.appSettings?.biometricAuthEnabled ? 'Enabled' : 'Disabled'} />
              <InfoRow label="Push Notifications" value={user.appSettings?.notificationsSettings?.pushNotificationsEnabled !== false ? 'On' : 'Off'} />
              <InfoRow label="Email Notifications" value={user.appSettings?.notificationsSettings?.emailNotificationsEnabled !== false ? 'On' : 'Off'} />
              <InfoRow label="SMS Notifications" value={user.appSettings?.notificationsSettings?.smsNotificationsEnabled ? 'On' : 'Off'} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: KYC + Didit details */}
        <div className="space-y-6 lg:col-span-2">
          {/* KYC Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">KYC Verification</CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    user.kycStatus === 'verified' && 'bg-green-900/40 text-green-300 border-green-700',
                    user.kycStatus === 'in_review' && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                    user.kycStatus === 'none' && 'bg-red-900/40 text-red-300 border-red-700',
                  )}
                >
                  {kycStatusLabels[user.kycStatus] || user.kycStatus}
                </Badge>
              </div>
              {user.kycSessionId && (
                <CardDescription className="font-mono text-xs">
                  Session: {user.kycSessionId}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <UserKycActions
                userId={user.id}
                kycSessionId={user.kycSessionId}
                currentStatus={user.kycStatus}
              />
            </CardContent>
          </Card>

          {/* Didit Decision Details */}
          {diditDecision && (
            <>
              {/* ID Verification */}
              {idVerification && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">ID Verification</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          idVerification.status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                          idVerification.status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                          !['Approved', 'Declined'].includes(idVerification.status || '') && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                        )}
                      >
                        {idVerification.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Document Images */}
                    {(idVerification.portrait_image || idVerification.front_image || idVerification.back_image) && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Documents</p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {idVerification.portrait_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Portrait</p>
                              <a href={idVerification.portrait_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idVerification.portrait_image}
                                  alt="Portrait"
                                  className="rounded-md border border-border object-cover w-full aspect-square hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {idVerification.front_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">ID Front</p>
                              <a href={idVerification.front_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idVerification.front_image}
                                  alt="ID Front"
                                  className="rounded-md border border-border object-cover w-full aspect-3/2 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {idVerification.back_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">ID Back</p>
                              <a href={idVerification.back_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idVerification.back_image}
                                  alt="ID Back"
                                  className="rounded-md border border-border object-cover w-full aspect-3/2 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    {/* Full document scans */}
                    {(idVerification.full_front_image || idVerification.full_back_image) && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Full Document Scans</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {idVerification.full_front_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Full Front</p>
                              <a href={idVerification.full_front_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idVerification.full_front_image}
                                  alt="Full front scan"
                                  className="rounded-md border border-border object-cover w-full aspect-3/2 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {idVerification.full_back_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Full Back</p>
                              <a href={idVerification.full_back_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idVerification.full_back_image}
                                  alt="Full back scan"
                                  className="rounded-md border border-border object-cover w-full aspect-3/2 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    {/* Video captures */}
                    {(idVerification.front_video || idVerification.back_video) && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Video Captures</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {idVerification.front_video && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Front Video</p>
                              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                              <video
                                src={idVerification.front_video}
                                controls
                                className="rounded-md border border-border w-full aspect-3/2"
                              />
                            </div>
                          )}
                          {idVerification.back_video && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Back Video</p>
                              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                              <video
                                src={idVerification.back_video}
                                controls
                                className="rounded-md border border-border w-full aspect-3/2"
                              />
                            </div>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    {/* Extracted Info */}
                    <div className="space-y-0">
                      <InfoRow label="Full Name" value={idVerification.full_name} />
                      <InfoRow label="First Name" value={idVerification.first_name} />
                      <InfoRow label="Last Name" value={idVerification.last_name} />
                      <InfoRow label="Date of Birth" value={idVerification.date_of_birth} />
                      <InfoRow label="Age" value={idVerification.age} />
                      <InfoRow label="Gender" value={idVerification.gender} />
                      <InfoRow label="Nationality" value={idVerification.nationality} />
                      <InfoRow label="Document Type" value={idVerification.document_type} />
                      <InfoRow label="Document Number" value={idVerification.document_number} />
                      {idVerification.personal_number && <InfoRow label="Personal Number" value={idVerification.personal_number} />}
                      <InfoRow label="Expiration Date" value={idVerification.expiration_date} />
                      <InfoRow label="Date of Issue" value={idVerification.date_of_issue} />
                      <InfoRow label="Issuing State" value={idVerification.issuing_state_name} />
                      <InfoRow label="Place of Birth" value={idVerification.place_of_birth} />
                      <InfoRow label="Address" value={idVerification.formatted_address || idVerification.address} />
                      {idVerification.marital_status && <InfoRow label="Marital Status" value={idVerification.marital_status} />}
                    </div>

                    {/* ID Verification Warnings */}
                    {idVerification.warnings && idVerification.warnings.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Warnings</p>
                          {idVerification.warnings.map((w, i) => (
                            <div key={i} className="text-xs border rounded p-2 border-yellow-700 bg-yellow-900/20">
                              <p className="font-medium text-yellow-300">{w.risk}</p>
                              <p className="text-yellow-400/80">{w.short_description}</p>
                              {w.long_description && <p className="text-muted-foreground mt-1">{w.long_description}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Liveness Check */}
              {livenessCheck && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Liveness Check</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          livenessCheck.status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                          livenessCheck.status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                          !['Approved', 'Declined'].includes(livenessCheck.status || '') && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                        )}
                      >
                        {livenessCheck.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reference Image & Liveness Video */}
                    {(livenessCheck.reference_image || livenessCheck.video_url) && (
                      <div className="space-y-3">
                        <div className="grid gap-3 grid-cols-2 max-w-sm">
                          {livenessCheck.reference_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Reference Image</p>
                              <a href={livenessCheck.reference_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={livenessCheck.reference_image}
                                  alt="Reference face"
                                  className="rounded-md border border-border object-cover w-full aspect-square hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {livenessCheck.video_url && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Liveness Video</p>
                              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                              <video
                                src={livenessCheck.video_url}
                                controls
                                className="rounded-md border border-border w-full aspect-square"
                              />
                            </div>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    <div className="space-y-0">
                      <InfoRow label="Method" value={livenessCheck.method} />
                      <InfoRow label="Score" value={livenessCheck.score != null ? `${livenessCheck.score}%` : null} />
                      <InfoRow label="Age Estimation" value={livenessCheck.age_estimation != null ? `${livenessCheck.age_estimation.toFixed(1)} years` : null} />
                      <InfoRow label="Face Quality" value={livenessCheck.face_quality != null ? `${livenessCheck.face_quality}%` : null} />
                    </div>

                    {/* Liveness Warnings */}
                    {livenessCheck.warnings && livenessCheck.warnings.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Warnings</p>
                          {livenessCheck.warnings.map((w, i) => (
                            <div key={i} className="text-xs border rounded p-2 border-yellow-700 bg-yellow-900/20">
                              <p className="font-medium text-yellow-300">{w.risk}</p>
                              <p className="text-yellow-400/80">{w.short_description}</p>
                              {w.long_description && <p className="text-muted-foreground mt-1">{w.long_description}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Face Match */}
              {faceMatch && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Face Match</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          faceMatch.status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                          faceMatch.status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                          !['Approved', 'Declined'].includes(faceMatch.status || '') && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                        )}
                      >
                        {faceMatch.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Face Comparison Images */}
                    {(faceMatch.source_image || faceMatch.target_image) && (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">Face Comparison</p>
                        <div className="grid gap-3 grid-cols-2 max-w-xs">
                          {faceMatch.source_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">ID Photo</p>
                              <a href={faceMatch.source_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={faceMatch.source_image}
                                  alt="Source face"
                                  className="rounded-md border border-border object-cover w-full aspect-square hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                          {faceMatch.target_image && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Selfie</p>
                              <a href={faceMatch.target_image} target="_blank" rel="noopener noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={faceMatch.target_image}
                                  alt="Target face"
                                  className="rounded-md border border-border object-cover w-full aspect-square hover:opacity-80 transition-opacity"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                        <Separator />
                      </div>
                    )}

                    <div className="space-y-0">
                      <InfoRow label="Similarity Score" value={faceMatch.score != null ? `${faceMatch.score.toFixed(1)}%` : null} />
                    </div>

                    {/* Face Match Warnings */}
                    {faceMatch.warnings && faceMatch.warnings.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Warnings</p>
                          {faceMatch.warnings.map((w, i) => (
                            <div key={i} className="text-xs border rounded p-2 border-yellow-700 bg-yellow-900/20">
                              <p className="font-medium text-yellow-300">{w.risk}</p>
                              <p className="text-yellow-400/80">{w.short_description}</p>
                              {w.long_description && <p className="text-muted-foreground mt-1">{w.long_description}</p>}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AML Screening */}
              {amlScreening && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">AML Screening</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          amlScreening.status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                          amlScreening.status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                          !['Approved', 'Declined'].includes(amlScreening.status || '') && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                        )}
                      >
                        {amlScreening.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <InfoRow label="Total Hits" value={amlScreening.total_hits} />
                    {amlScreening.score != null && <InfoRow label="Score" value={`${(amlScreening.score * 100).toFixed(1)}%`} />}
                    {amlScreening.hits && amlScreening.hits.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">Hits</p>
                        {amlScreening.hits.map((hit, i) => (
                          <div key={i} className="text-xs border rounded p-2 mb-1 border-border">
                            <p>Name: {hit.full_name || hit.caption || '—'}</p>
                            {hit.score != null && <p>Score: {(hit.score * 100).toFixed(1)}%</p>}
                            {hit.datasets && <p>Datasets: {hit.datasets.join(', ')}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* IP Analysis */}
              {ipAnalysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">IP Analysis</CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          ipAnalysis.status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                          ipAnalysis.status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                          !['Approved', 'Declined'].includes(ipAnalysis.status || '') && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                        )}
                      >
                        {ipAnalysis.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <InfoRow label="IP Address" value={ipAnalysis.ip_address} />
                    <InfoRow label="Country" value={ipAnalysis.ip_country} />
                    <InfoRow label="State" value={ipAnalysis.ip_state} />
                    <InfoRow label="City" value={ipAnalysis.ip_city} />
                    <InfoRow label="ISP" value={ipAnalysis.isp} />
                    <InfoRow label="VPN/Tor" value={ipAnalysis.is_vpn_or_tor ? 'Yes' : 'No'} />
                    <InfoRow label="Data Center" value={ipAnalysis.is_data_center ? 'Yes' : 'No'} />
                    <InfoRow label="Browser" value={ipAnalysis.browser_family} />
                    <InfoRow label="Timezone" value={ipAnalysis.time_zone} />
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              {diditDecision.reviews && diditDecision.reviews.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {diditDecision.reviews.map((r, i) => (
                        <div key={i} className="text-xs border rounded p-2 border-border">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{r.user}</span>
                            <Badge variant="outline" className={cn(
                              r.new_status === 'Approved' && 'bg-green-900/40 text-green-300 border-green-700',
                              r.new_status === 'Declined' && 'bg-red-900/40 text-red-300 border-red-700',
                            )}>
                              {r.new_status}
                            </Badge>
                          </div>
                          {r.comment && <p className="mt-1">{r.comment}</p>}
                          <p className="text-muted-foreground mt-1">{formatFullDate(r.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No decision data available */}
              {!idVerification && !livenessCheck && !faceMatch && !amlScreening && (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    Didit session exists but no verification data is available yet.
                    The user may not have completed the verification process.
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* User's Jars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Jars Created ({createdJarsResult.totalDocs})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {createdJarsResult.docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jars created</p>
              ) : (
                <div className="space-y-2">
                  {createdJarsResult.docs.map((jar: any) => (
                    <div
                      key={jar.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{jar.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Goal: {formatAmount(jar.goalAmount || 0, jar.currency || 'GHS')}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(jarStatusStyles[jar.status] || '')}>
                        {jar.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jars as Collector */}
          {collectorJarsResult.totalDocs > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Jars as Collector ({collectorJarsResult.totalDocs})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {collectorJarsResult.docs.map((jar: any) => (
                    <div
                      key={jar.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{jar.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Goal: {formatAmount(jar.goalAmount || 0, jar.currency || 'GHS')}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(jarStatusStyles[jar.status] || '')}>
                        {jar.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User's Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Recent Transactions ({transactionsResult.totalDocs})
              </CardTitle>
              <CardDescription>
                Last 20 transactions involving this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions found</p>
              ) : (
                <TransactionsDataTable transactions={transactions} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
