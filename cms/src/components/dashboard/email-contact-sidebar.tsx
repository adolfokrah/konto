'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/utilities/ui'

type LinkedUser = { id: string; firstName: string; lastName: string; email: string }

export type ContactSidebarProps = {
  primaryAddr: string
  primaryInitials: string
  primaryColor: string
  primaryName: string
  linkedUser: LinkedUser | null
  messageCount: number
  startedDate: string
  direction: string
  allAddresses: { addr: string; initials: string; color: string; name: string; bare: string }[]
}

export function EmailContactSidebar({
  primaryAddr,
  primaryInitials,
  primaryColor,
  primaryName,
  linkedUser,
  messageCount,
  startedDate,
  direction,
  allAddresses,
}: ContactSidebarProps) {
  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-l">
      {/* Contact header */}
      <div className="border-b p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white',
              primaryColor,
            )}
          >
            {primaryInitials}
          </span>
          <div>
            <p className="text-sm font-semibold">{primaryName}</p>
            <p className="mt-0.5 break-all text-xs text-muted-foreground">{primaryAddr}</p>
          </div>
          {linkedUser && (
            <Link
              href={`/dashboard/users/${linkedUser.id}`}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <ExternalLink className="h-3 w-3" />
              View platform user
            </Link>
          )}
        </div>
      </div>

      {/* Conversation details */}
      <div className="border-b p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Conversation
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-medium tabular-nums">{messageCount}</span>
          </div>
          {startedDate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Started</span>
              <span className="font-medium">{startedDate}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Direction</span>
            <span
              className={cn(
                'rounded-full px-2 py-px text-[10px] font-semibold capitalize',
                direction === 'inbound'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
              )}
            >
              {direction}
            </span>
          </div>
        </div>
      </div>

      {/* Participants */}
      {allAddresses.length > 0 && (
        <div className="p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Participants
          </p>
          <div className="space-y-2">
            {allAddresses.slice(0, 6).map((p) => (
              <div key={p.addr} className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                    p.color,
                  )}
                >
                  {p.initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{p.bare}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
