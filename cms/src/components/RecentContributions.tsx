import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

interface RecentContributionsProps {
  jarId: string
  currency?: string
  limit?: number
  page?: number
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

function formatAmount(amount: number, currency: string = 'GHS'): string {
  const symbol = currency === 'GHS' ? '₵' : '₦'
  return `${symbol}${amount.toFixed(2)}`
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

export default async function RecentContributions({ jarId, currency, limit = 5, page = 1 }: RecentContributionsProps) {
  try {
    const totalLimit = limit * page
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    const res = await fetch(
      `${apiUrl}/jars/${jarId}/recent-contributions?limit=${totalLimit}&page=1`,
      { next: { revalidate: 30 } },
    )

    if (!res.ok) throw new Error('Failed to fetch contributions')

    const data = await res.json()
    const contributions = data.docs || []
    const totalDocs = data.totalDocs || 0
    const hasMore = totalLimit < totalDocs

    const jarCurrency = currency || 'GHS'

    if (contributions.length === 0 && page === 1) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 font-supreme">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contributions</h3>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contributions</h3>
          <span className="text-sm text-gray-500">{totalDocs} total</span>
        </div>

        <div className="space-y-4">
          {contributions.map((contribution: any) => {
            const contributorName = contribution.contributor || 'Anonymous'
            const initials = getInitials(contributorName)
            const amount = contribution.amountContributed || 0
            const timeAgo = formatTimeAgo(contribution.createdAt)

            return (
              <div
                key={contribution.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary-light font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{contributorName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(amount, jarCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4 mt-2">
            <Link
              href={`?cPage=${page + 1}`}
              scroll={false}
              className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
            >
              Load more
            </Link>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error fetching contributions:', error)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contributions</h3>
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
