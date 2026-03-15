'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { ChevronLeft, ChevronRight, Inbox, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { hashColor } from '@/utilities/avatarColors'

export type EmailRow = {
  id: string
  threadId?: string
  direction: 'inbound' | 'outbound'
  from: string
  to: { email: string }[]
  subject: string
  bodyText: string | null
  status: 'received' | 'sent' | 'sending' | 'failed' | 'draft'
  isRead: boolean
  linkedUser: { id: string; firstName: string; lastName: string; email: string; photoUrl?: string | null } | null
  createdAt: string
  messageCount?: number
  participants?: string[]
}

function smartDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString(undefined, { weekday: 'short' })
  if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function extractName(addr: string): string {
  const m = addr.match(/^([^<]+)</)
  const raw = m ? m[1].trim() : addr.split('@')[0]
  return raw.replace(/[._-]/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function getInitials(addr: string): string {
  const name = extractName(addr)
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}


export function EmailsDataTable({
  emails,
  tab,
  activeId,
  pagination,
}: {
  emails: EmailRow[]
  tab: string
  activeId?: string
  pagination: { currentPage: number; totalPages: number; totalRows: number; rowsPerPage: number }
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
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        {tab === 'inbox' ? <Inbox className="h-10 w-10 opacity-20" /> : <Send className="h-10 w-10 opacity-20" />}
        <p className="text-sm font-medium">{tab === 'inbox' ? 'Inbox zero' : 'Nothing sent yet'}</p>
        <p className="text-xs text-muted-foreground/50">
          {tab === 'inbox' ? "You're all caught up!" : 'Sent emails will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {emails.map((email) => {
          const primaryAddr = email.direction === 'inbound' ? email.from : (email.to[0]?.email ?? '')
          const name = extractName(primaryAddr)
          const ini = getInitials(primaryAddr)
          const color = hashColor(primaryAddr)
          const unread = !email.isRead && email.direction === 'inbound'
          const count = email.messageCount ?? 1
          const isActive = email.id === activeId

          const preview = email.bodyText
            ? email.bodyText.replace(/\n+/g, ' ').trim()
            : ''

          const allParticipants = email.participants
            ? [...new Set(email.participants.map(extractName))].slice(0, 3)
            : [name]

          const participantAddrs = email.participants ?? [primaryAddr]
          const visibleAddrs = participantAddrs.slice(0, 3)
          const extraCount = participantAddrs.length - 3

          return (
            <button
              key={email.id}
              onClick={() => {
                const p = new URLSearchParams(searchParams.toString())
                p.set('emailId', email.id)
                router.push(`?${p.toString()}`)
              }}
              className={cn(
                'flex w-full flex-col gap-1.5 border-b border-border/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/40',
                isActive && 'bg-muted/60',
                unread && !isActive && 'bg-primary/3',
              )}
            >
              {/* Row 1: avatar + name + date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    {email.linkedUser?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={email.linkedUser.photoUrl} alt={name} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white', color)}>
                        {ini}
                      </span>
                    )}
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background" />
                    )}
                  </div>
                  <span className={cn(
                    'truncate text-[13px]',
                    unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
                  )}>
                    {count > 1 ? [...new Set(participantAddrs.map(extractName))].slice(0, 3).join(', ') : name}
                  </span>
                  {count > 1 && (
                    <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  )}
                </div>
                <span className={cn('shrink-0 text-[11px] tabular-nums', unread ? 'font-semibold text-foreground' : 'text-muted-foreground/70')}>
                  {smartDate(email.createdAt)}
                </span>
              </div>

              {/* Row 2: subject */}
              <p className={cn(
                'text-xs leading-snug',
                unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/70',
              )}>
                {email.subject}
              </p>

              {/* Row 3: preview */}
              {preview && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/55">
                  {preview}
                </p>
              )}

              {/* Row 4: overlapping avatars */}
              {count > 1 && (
                <div className="flex items-center pt-0.5">
                  {visibleAddrs.map((addr, i) => (
                    <span
                      key={i}
                      style={{ zIndex: i + 1, marginLeft: i === 0 ? 0 : -6 }}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-background',
                        hashColor(addr),
                      )}
                    >
                      {getInitials(addr)}
                    </span>
                  ))}
                  {extraCount > 0 && (
                    <span
                      style={{ zIndex: visibleAddrs.length + 1, marginLeft: -6 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-background"
                    >
                      +{extraCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-card px-4 py-2 text-xs text-muted-foreground shrink-0">
          <span className="tabular-nums">
            {(pagination.currentPage - 1) * pagination.rowsPerPage + 1}–
            {Math.min(pagination.currentPage * pagination.rowsPerPage, pagination.totalRows)} of {pagination.totalRows}
          </span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pagination.currentPage <= 1} onClick={() => goToPage(pagination.currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => goToPage(pagination.currentPage + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
