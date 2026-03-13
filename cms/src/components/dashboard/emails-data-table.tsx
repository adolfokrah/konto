'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type EmailRow = {
  id: string
  direction: 'inbound' | 'outbound'
  from: string
  to: { email: string }[]
  subject: string
  bodyText: string | null
  status: 'received' | 'sent' | 'sending' | 'failed' | 'draft'
  isRead: boolean
  linkedUser: { id: string; firstName: string; lastName: string; email: string } | null
  createdAt: string
}

const statusStyles: Record<string, string> = {
  received: 'bg-blue-100 text-blue-800 border-blue-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function EmailsDataTable({
  emails,
  pagination,
}: {
  emails: EmailRow[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRows: number
    rowsPerPage: number
  }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`?${params.toString()}`)
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No emails found</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_3fr_1fr_1fr] gap-4 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        <span>From / To</span>
        <span>Subject</span>
        <span>Status</span>
        <span className="text-right">Date</span>
      </div>

      <div className="divide-y divide-border/50 rounded-md border">
        {emails.map((email) => {
          const counterpart =
            email.direction === 'inbound'
              ? email.from
              : email.to.map((t) => t.email).join(', ')

          const preview = email.bodyText
            ? email.bodyText.slice(0, 80).replace(/\n/g, ' ') + (email.bodyText.length > 80 ? '…' : '')
            : null

          return (
            <button
              key={email.id}
              onClick={() => router.push(`/dashboard/emails/${email.id}`)}
              className={cn(
                'grid w-full grid-cols-[2fr_3fr_1fr_1fr] gap-4 px-3 py-3 text-left transition-colors hover:bg-muted/50',
                !email.isRead && email.direction === 'inbound' && 'bg-primary/5',
              )}
            >
              {/* From/To */}
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate text-sm',
                    !email.isRead && email.direction === 'inbound'
                      ? 'font-semibold text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {counterpart}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
                  {email.direction === 'inbound' ? '→ inbound' : '→ outbound'}
                </p>
              </div>

              {/* Subject + preview */}
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate text-sm',
                    !email.isRead && email.direction === 'inbound'
                      ? 'font-semibold text-foreground'
                      : 'text-foreground/80',
                  )}
                >
                  {email.subject}
                </p>
                {preview && (
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">{preview}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center">
                <Badge variant="outline" className={cn('text-xs capitalize', statusStyles[email.status])}>
                  {email.status}
                </Badge>
              </div>

              {/* Date */}
              <div className="flex items-center justify-end">
                <span className="text-xs text-muted-foreground">{formatShortDate(email.createdAt)}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            {(pagination.currentPage - 1) * pagination.rowsPerPage + 1}–
            {Math.min(pagination.currentPage * pagination.rowsPerPage, pagination.totalRows)} of{' '}
            {pagination.totalRows}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={pagination.currentPage <= 1}
              onClick={() => goToPage(pagination.currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 tabular-nums">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => goToPage(pagination.currentPage + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
