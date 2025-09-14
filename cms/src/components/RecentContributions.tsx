import { getPayload } from 'payload'
import config from '@payload-config'
import type { Contribution } from '@/payload-types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface RecentContributionsProps {
  jarId: string
  limit?: number
}

interface ContributionWithRelations extends Omit<Contribution, 'jar' | 'collector'> {
  jar: {
    id: string
    name: string
  }
  collector?: {
    id: string
    name?: string
    email?: string
  }
}

function getInitials(name: string): string {
  if (!name) return '?'

  const words = name.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

function formatAmount(amount: number): string {
  return `₵${amount.toFixed(2)}`
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths}mo ago`
}

export default async function RecentContributions({ jarId, limit = 10 }: RecentContributionsProps) {
  const payload = await getPayload({ config })

  try {
    const contributions = await payload.find({
      collection: 'contributions',
      where: {
        jar: {
          equals: jarId,
        },
        paymentStatus: {
          equals: 'completed',
        },
        type: {
          equals: 'contribution',
        },
        viaPaymentLink: {
          equals: true,
        },
      },
      limit,
      sort: '-createdAt',
      depth: 2,
    })

    const contributionsWithRelations = contributions.docs as ContributionWithRelations[]

    if (contributionsWithRelations.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 font-supreme">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h3>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <p className="text-gray-500">No contributions yet</p>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white font-supreme">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h3>

        <div className="space-y-4">
          {contributionsWithRelations.map((contribution) => {
            const contributorName = contribution.contributor || 'Anonymous'
            const initials = getInitials(contributorName)
            const amount = contribution.amountContributed || 0
            const timeAgo = formatTimeAgo(contribution.createdAt)

            return (
              <div
                key={contribution.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                {/* Left side - Avatar, Name, ID, Time */}
                <div className="flex items-center space-x-3">
                  {/* Avatar with initials */}
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary-light font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Contributor info */}
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{contributorName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                </div>

                {/* Right side - Payment method and Amount */}
                <div className="flex items-center space-x-4">
                  {/* Amount */}
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(amount)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching contributions:', error)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h3>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-500">Failed to load contributions</p>
        </div>
      </div>
    )
  }
}
