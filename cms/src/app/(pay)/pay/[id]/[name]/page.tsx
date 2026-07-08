import JarGallery from '@/components/JarGallery'
import ExpandableDescription from '@/components/ExpandableDescription'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ContributionInput from '@/components/ContributionInput'
import RecentContributions from '@/components/RecentContributions'
import ReportJarButton from '@/components/ReportJarButton'
import { Metadata } from 'next'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { id: jarId } = await params

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/jars/${jarId}/contribution-page`,
      { cache: 'no-store' },
    )

    const data = await res.json()

    const jar = data?.data

    if (!jar) {
      return {
        title: 'Jar Not Found - Hoga',
        description: 'The requested jar could not be found.',
      }
    }

    // Get the image URL for og:image
    const imageUrl = jar.image && typeof jar.image === 'object' ? jar.image.url : null
    const jarImageThumbnail =
      jar.image && typeof jar.image === 'object' ? jar.image.sizes?.thumbnail : null
    const imageForMeta = jarImageThumbnail?.url || imageUrl || null

    // Get creator name
    const creatorName = typeof jar.creator === 'object' ? `${jar.creator.firstName || ''} ${jar.creator.lastName || ''}`.trim() : jar.creator

    return {
      title: `Contribute to ${jar.name}`,
      description: jar.description
        ? `${jar.description.substring(0, 160)}...`
        : `Support ${jar.name} by making a contribution. Organized by ${creatorName}.`,
      keywords: [
        'contribution',
        'donation',
        'fundraising',
        'Hoga',
        jar.name,
        creatorName || '',
        jar.currency || 'GHS',
      ].filter(Boolean),
      authors: [{ name: creatorName || 'HogapayUser' }],
      openGraph: {
        title: `Contribute to ${jar.name}`,
        description: jar.description || `Support ${jar.name} by making a contribution.`,
        type: 'website',
        images: imageForMeta
          ? [
              {
                url: imageForMeta,
                width: jarImageThumbnail?.width || 1200,
                height: jarImageThumbnail?.height || 630,
                alt: jar.name,
              },
            ]
          : [],
        siteName: 'Hoga',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Contribute to ${jar.name}`,
        description: jar.description || `Support ${jar.name} by making a contribution.`,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: `/pay/${jarId}/${encodeURIComponent(jar.name || 'jar')}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Contribution Page - Hoga',
      description: 'Make a contribution to support this cause.',
    }
  }
}

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string; name: string }>
  searchParams: Promise<{ collectorId?: string; cPage?: string }>
}) {
  const { id: jarId } = await params
  const resolvedSearchParams = await searchParams

  try {
    // Get jar data, system settings, and contribution totals in one call
    const jarRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/jars/${jarId}/contribution-page`,
      { cache: 'no-store' },
    )


    const jarData = await jarRes.json()
    const jarWithBalance = jarData?.data
    const systemSettings = jarData?.systemSettings
    const contributorAvatars = jarData?.contributorAvatars ?? []
    const donorCount = jarData?.donorCount ?? jarData?.data?.balanceBreakDown?.donorCount ?? 0

    if (!jarWithBalance) {
      throw new Error('Jar not found')
    }

    // Get the image URL if it exists
    const imageUrl =
      jarWithBalance.image && typeof jarWithBalance.image === 'object'
        ? jarWithBalance.image.url
        : null

    // Build carousel: main image first, then additional gallery photos
    const galleryUrls: string[] = Array.isArray(jarWithBalance.images)
      ? jarWithBalance.images
          .map((item: any) =>
            item?.image && typeof item.image === 'object' ? item.image.url : null,
          )
          .filter(Boolean)
      : []
    const carouselImages: string[] = [
      ...(imageUrl ? [imageUrl] : []),
      ...galleryUrls,
    ]

    // Get the creator photo URL if it exists
    const creatorPhotoUrl =
      jarWithBalance?.creator &&
      typeof jarWithBalance.creator === 'object' &&
      jarWithBalance.creator.photo
        ? typeof jarWithBalance.creator.photo === 'object'
          ? jarWithBalance.creator.photo.sizes?.thumbnail?.url
          : jarWithBalance.creator.photo
        : null

    // Get creator name, username, and initials
    const creatorName =
      typeof jarWithBalance?.creator === 'object'
        ? `${jarWithBalance?.creator?.firstName || ''} ${jarWithBalance?.creator?.lastName || ''}`.trim()
        : jarWithBalance?.creator
    const creatorUsername =
      typeof jarWithBalance?.creator === 'object' ? jarWithBalance?.creator?.username : null
    const creatorKycStatus =
      typeof jarWithBalance?.creator === 'object' ? jarWithBalance?.creator?.kycStatus : null
    const creatorInitials = creatorName
      ? creatorName
          .split(' ')
          .map((name: string) => name.charAt(0))
          .join('')
          .substring(0, 2)
          .toUpperCase()
      : 'UN' // Unknown if no name

    // Resolve collector id from query param or fallback to jar creator
    const collectorIdFromQuery =
      (resolvedSearchParams?.collectorId as string) || null
    const creatorId =
      typeof jarWithBalance?.creator === 'object'
        ? jarWithBalance?.creator?.id
        : jarWithBalance?.creator
    const effectiveCollectorId = collectorIdFromQuery || creatorId

    // ---- Goal / progress (only when creator enabled it) ----
    const currencySymbol = jarWithBalance.currency === 'GHS' ? '₵' : '₦'
    const showGoal =
      !!jarWithBalance.goalAmount &&
      jarWithBalance.goalAmount > 0 &&
      jarWithBalance.paymentPage?.showGoal === true
    const raisedAmount = jarWithBalance.balanceBreakDown?.totalContributedAmount || 0
    const goalPct = showGoal
      ? Math.min((raisedAmount / jarWithBalance.goalAmount) * 100, 100)
      : 0
    const deadlineDate = jarWithBalance.deadline ? new Date(jarWithBalance.deadline) : null
    const daysLeft = deadlineDate
      ? Math.max(Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000), 0)
      : null
    const fmtMoney = (n: number) =>
      n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return (
      <div className="min-h-screen bg-primary-light text-black">
        <div className="container mx-auto px-4 md:px-8 py-6 sm:py-8">
          {/* Title */}
          <h1 className="font-supreme font-bold text-2xl lg:text-4xl tracking-tight text-balance mb-5">
            {jarWithBalance.name}
          </h1>

          <div className="grid gap-8 lg:gap-9 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:items-start">
            {/* ============ DONATE PANEL — after the story top on mobile, sticky right on desktop ============ */}
            <aside className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 self-start">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_1px_2px_rgba(27,35,46,0.06),0_12px_32px_-16px_rgba(27,35,46,0.18)]">
                {/* Goal progress — only when creator enabled it */}
                {showGoal && (
                  <div className="mb-5 font-supreme">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold tabular-nums">
                        {currencySymbol}
                        {fmtMoney(raisedAmount)}
                      </span>
                      <span className="text-sm text-gray-600 tabular-nums">
                        raised of {currencySymbol}
                        {fmtMoney(jarWithBalance.goalAmount)} goal
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-700 transition-all duration-300 ease-out"
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>
                        <b className="text-green-700">{Math.round(goalPct)}%</b> funded
                      </span>
                      <span className="tabular-nums">
                        {donorCount} {donorCount === 1 ? 'contribution' : 'contributions'}
                        {daysLeft !== null && ` · ${daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contributor avatar stack */}
                {(contributorAvatars.length > 0 || donorCount > 0) && (
                  <div className="flex items-center gap-2.5 mb-5 font-supreme">
                    <AvatarGroup>
                      {contributorAvatars
                        .slice(0, 3)
                        .map((a: { initials: string; photoUrl: string | null }, i: number) => (
                          <Avatar key={i} className="w-7 h-7 border-2 border-white">
                            <AvatarImage src={a.photoUrl || undefined} className="object-cover" />
                            <AvatarFallback
                              className={`text-[10px] font-semibold text-white ${
                                ['bg-[#B45309]', 'bg-[#15803D]', 'bg-[#1D4ED8]'][i % 3]
                              }`}
                            >
                              {a.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      {donorCount > 3 && (
                        <AvatarGroupCount className="w-7 h-7 text-[10px] bg-gray-700 text-white">
                          +{donorCount - 3}
                        </AvatarGroupCount>
                      )}
                    </AvatarGroup>
                    <p className="text-xs text-gray-600">
                      <b className="text-black">{donorCount}</b>{' '}
                      {donorCount === 1 ? 'person has' : 'people have'} contributed
                    </p>
                  </div>
                )}

                {/* Contribution Input — all payment logic + conditions live here */}
                <div id="contribution-section" />
                <ContributionInput
                  currency={jarWithBalance.currency}
                  isFixedAmount={jarWithBalance.isFixedContribution || false}
                  fixedAmount={jarWithBalance.acceptedContributionAmount || 0}
                  jarId={jarId}
                  jarName={jarWithBalance.name}
                  collectorId={effectiveCollectorId}
                  allowAnonymousContributions={jarWithBalance.allowAnonymousContributions || false}
                  transactionFeePercentage={systemSettings?.collectionFee || 1.95}
                  customFields={jarWithBalance.customFields || []}
                  acceptingContributions={jarWithBalance.acceptingContributions !== false}
                  actionLabel={jarWithBalance.paymentPage?.donationLabel === 'donate' ? 'donate' : 'contribute'}
                />
              </div>
            </aside>

            {/* ===== TOP-LEFT: gallery, organizer, story, safety (above panel on mobile) ===== */}
            <div className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
              {/* Jar image gallery — hero + thumbnail strip */}
              {carouselImages.length > 0 && (
                <JarGallery images={carouselImages} alt={jarWithBalance.name || 'Jar image'} />
              )}

              {/* Organizer row */}
              <div className="flex items-center gap-3 py-4 border-b border-gray-200 mt-4 font-supreme">
                <Avatar className="w-11 h-11 shrink-0">
                  <AvatarImage src={creatorPhotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-black text-white font-semibold">
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm">
                    <b className="font-bold">
                      {typeof jarWithBalance?.creator === 'object'
                        ? `${jarWithBalance?.creator?.firstName || ''} ${jarWithBalance?.creator?.lastName || ''}`.trim()
                        : jarWithBalance?.creator}
                    </b>{' '}
                    is organizing this fundraiser
                  </p>
                  <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                    {creatorUsername && <span>@{creatorUsername}</span>}
                    {jarWithBalance?.creator &&
                      typeof jarWithBalance.creator === 'object' &&
                      jarWithBalance.creator.country && (
                        <span className="capitalize">· {jarWithBalance.creator.country}</span>
                      )}
                    {creatorKycStatus === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Story */}
              {jarWithBalance.description && (
                <div className="py-5 border-b border-gray-200">
                  <ExpandableDescription
                    description={jarWithBalance.description}
                    className="text-gray-700 font-supreme text-base"
                  />
                </div>
              )}

              {/* Safety tip */}
              <Alert className="mt-5 font-supreme bg-[#FCEFD3] border-[#EBD59B] rounded-2xl [&>svg]:text-orange-500">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle className="text-orange-900">Stay safe</AlertTitle>
                <AlertDescription className="text-orange-800/80">
                  Before contributing, make sure you know and trust the organizer. Check their
                  username and look for the{' '}
                  <ShieldCheck className="inline h-3.5 w-3.5 text-green-600 mx-0.5 align-middle" />{' '}
                  verified badge.
                </AlertDescription>
              </Alert>
            </div>

            {/* ===== BOTTOM-LEFT: contributions + report (below panel) ===== */}
            <div className="order-3 min-w-0 lg:col-start-1 lg:row-start-2">
              {/* Words of support */}
              {jarWithBalance.paymentPage?.showRecentContributions && (
                <div className="pt-2 lg:pt-6">
                  <RecentContributions
                    jarId={jarId}
                    currency={jarWithBalance.currency}
                    limit={5}
                    page={Number(resolvedSearchParams.cPage) || 1}
                  />
                </div>
              )}

              {/* Report Jar */}
              <div className="flex justify-center py-4">
                <ReportJarButton jarId={jarId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching jar:', error)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-title-bold-lg text-red-600 mb-4">Jar Not Found</h1>
          <p className="text-title-regular-m text-gray-600">Could not find jar with ID: {jarId}</p>
        </div>
      </div>
    )
  }
}
