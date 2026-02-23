import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import ExpandableDescription from '@/components/ExpandableDescription'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShieldCheck } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Goal from '@/components/Goal'
import ContributionInput from '@/components/ContributionInput'
import RecentContributions from '@/components/RecentContributions'
import { Metadata } from 'next'

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { id: jarId } = await params

  const payload = await getPayload({ config })

  try {
    // Get jar data for metadata
    const res = await payload.find({
      collection: 'jars',
      where: {
        id: {
          equals: jarId,
        },
        status: {
          equals: 'open',
        },
      },
      depth: 2,
    })

    const jar = res?.docs?.[0]

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
      authors: [{ name: creatorName || 'Hoga User' }],
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
  searchParams: Promise<{ collectorId?: string; collectionId?: string }>
}) {
  const { id: jarId } = await params
  const resolvedSearchParams = await searchParams

  const payload = await getPayload({ config })

  try {
    // Get jar data directly using Payload (without status filter to check if jar exists)
    const res = await payload.find({
      collection: 'jars',
      where: {
        id: {
          equals: jarId,
        },
      },
      depth: 2, // Include related data like creator
    })

    const jar = res?.docs?.[0]
    if (!jar) {
      throw new Error('Jar not found')
    }

    // Check if jar is open
    if (jar.status !== 'open') {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-title-bold-lg text-gray-700 mb-4">
              {jar.status === 'sealed' ? 'Jar Sealed' : 'Jar Not Available'}
            </h1>
            <p className="text-title-regular-m text-gray-600">
              This jar is no longer accepting contributions.
            </p>
          </div>
        </div>
      )
    }

    // Get system settings for transaction fee percentage
    const systemSettings = await payload.findGlobal({
      slug: 'system-settings',
    })

    // Get all contributions for this jar to calculate total
    const allContributions = await payload.find({
      collection: 'transactions',
      where: {
        jar: {
          equals: jarId,
        },
      },
      limit: 1000, // Get all contributions
    })

    // Calculate total contributed amount (same logic as jar summary endpoint)
    const totalContributedAmount = allContributions.docs
      .filter(
        (contribution) =>
          contribution.paymentStatus === 'completed' && contribution.type === 'contribution',
      )
      .reduce((sum, contribution) => sum + (contribution.amountContributed || 0), 0)

    // Add balance breakdown to jar object
    const jarWithBalance = {
      ...jar,
      balanceBreakDown: {
        totalContributedAmount: Number(totalContributedAmount.toFixed(2)),
      },
    }

    // Get the image URL if it exists
    const imageUrl =
      jarWithBalance.image && typeof jarWithBalance.image === 'object'
        ? jarWithBalance.image.url
        : null

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
      (resolvedSearchParams?.collectorId as string) || (resolvedSearchParams?.collectionId as string) || null
    const creatorId =
      typeof jarWithBalance?.creator === 'object'
        ? jarWithBalance?.creator?.id
        : jarWithBalance?.creator
    const effectiveCollectorId = collectorIdFromQuery || creatorId

    return (
      <div className="min-h-screen bg-primary-light text-black">
        <div className="max-w-2xl mx-auto md:p-4 md:rounded-3xl m-5 bg-white">
          {/* Jar Details */}
          <div>
            {/* Jar Image - Blurred background with centered overlay */}
            {imageUrl && (
              <div className="relative w-full h-80 lg:h-100 overflow-hidden rounded-none  md:rounded-xl">
                {/* Blurred background */}
                <Image
                  src={imageUrl}
                  alt=""
                  fill
                  className="object-cover scale-110 blur-lg brightness-75"
                  priority
                />
                {/* Centered overlay image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={imageUrl}
                    alt={jarWithBalance.name || 'Jar image'}
                    width={500}
                    height={500}
                    className="h-full w-auto object-contain"
                    priority
                  />
                </div>
              </div>
            )}
          <div className="p-6">
            <h1 className="font-bold mb-4 text-2xl lg:text-4xl">{jarWithBalance.name}</h1>

            {jarWithBalance.description && (
              <ExpandableDescription
                description={jarWithBalance.description}
                className="text-gray-700 mb-4 font-supreme text-base"
              />
            )}
            <Separator className="my-6" />

            {/* Organizer Section */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 font-supreme">
              <div className="flex gap-4 items-start">
                <Avatar className="w-16 h-16 ring-2 ring-white shadow-sm">
                  <AvatarImage src={creatorPhotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white text-lg font-semibold">
                    {creatorInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-xl mb-1">
                    {typeof jarWithBalance?.creator === 'object'
                      ? `${jarWithBalance?.creator?.firstName || ''} ${jarWithBalance?.creator?.lastName || ''}`.trim()
                      : jarWithBalance?.creator}
                  </p>
                  {creatorUsername && (
                    <p className="text-gray-500 text-sm mb-2">@{creatorUsername}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-full">
                      Organizer
                    </span>
                    {jarWithBalance?.creator &&
                      typeof jarWithBalance.creator === 'object' &&
                      jarWithBalance.creator.country && (
                        <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-full capitalize">
                          {jarWithBalance.creator.country}
                        </span>
                      )}
                    {creatorKycStatus === 'verified' && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Goal Section - Show if jar has goal amount and showGoal is enabled */}
            {jarWithBalance.goalAmount &&
            jarWithBalance.goalAmount > 0 &&
            jarWithBalance.paymentPage?.showGoal === true ? (
              <Goal
                currentAmount={jarWithBalance.balanceBreakDown?.totalContributedAmount || 0}
                targetAmount={jarWithBalance.goalAmount}
                deadline={
                  jarWithBalance.deadline ||
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                }
                currency={jarWithBalance.currency === 'GHS' ? '₵' : '₦'}
                className="my-6"
              />
            ) : null}

            {/* Contribution Input */}
            <ContributionInput
              currency={jarWithBalance.currency}
              isFixedAmount={jarWithBalance.isFixedContribution || false}
              fixedAmount={jarWithBalance.acceptedContributionAmount || 0}
              className="my-6"
              jarId={jarId}
              jarName={jarWithBalance.name}
              collectorId={effectiveCollectorId}
              allowAnonymousContributions={jarWithBalance.allowAnonymousContributions || false}
              transactionFeePercentage={systemSettings?.collectionFee || 1.95}
            />

            <Separator />

            {/* Recent Contributions */}
            {jarWithBalance.paymentPage?.showRecentContributions && (
              <RecentContributions jarId={jarId} limit={5} />
            )}
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
