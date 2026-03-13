'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { EmailBodyViewer } from '@/components/dashboard/email-body-viewer'

export type ThreadMessage = {
  id: string
  direction: 'inbound' | 'outbound'
  from: string
  to: { email: string }[]
  subject: string
  bodyHtml: string | null
  bodyText: string | null
  status: string
  isRead: boolean
  createdAt: string
  linkedUser: { id: string; firstName: string; lastName: string; email: string } | null
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

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
  'bg-rose-500', 'bg-teal-500', 'bg-indigo-500', 'bg-pink-500',
]
function avatarColor(addr: string): string {
  let h = 0
  for (let i = 0; i < addr.length; i++) h = addr.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function MessageCard({
  msg,
  expanded,
  onToggle,
}: {
  msg: ThreadMessage
  expanded: boolean
  onToggle: () => void
}) {
  const name = extractName(msg.from)
  const ini = getInitials(msg.from)
  const color = avatarColor(msg.from)
  const toAddresses = (msg.to ?? []).map(t => t.email).join(', ')

  const preview = msg.bodyText
    ? msg.bodyText.replace(/\n+/g, ' ').trim().slice(0, 120)
    : ''

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border bg-card transition-shadow',
      expanded ? 'shadow-md' : 'shadow-sm',
    )}>
      {/* Header — always clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30"
      >
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white mt-0.5', color)}>
          {ini}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <span className={cn(
                'rounded-full px-2 py-px text-[10px] font-semibold',
                msg.direction === 'inbound'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
              )}>
                {msg.direction === 'inbound' ? 'received' : 'sent'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>

          {expanded ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              <span className="opacity-60">to</span> {toAddresses}
            </p>
          ) : (
            <p className="mt-0.5 truncate text-xs text-muted-foreground/60">{preview}</p>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 pb-5 pt-4">
          <EmailBodyViewer html={msg.bodyHtml} text={msg.bodyText} />

          {msg.linkedUser && (
            <div className="mt-4 border-t pt-3">
              <Link
                href={`/dashboard/users/${msg.linkedUser.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View {msg.linkedUser.firstName || msg.linkedUser.email} on platform
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EmailThreadView({ messages }: { messages: ThreadMessage[] }) {
  // Latest message expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(messages.length > 0 ? [messages[messages.length - 1].id] : []),
  )

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {messages.map(msg => (
        <MessageCard
          key={msg.id}
          msg={msg}
          expanded={expanded.has(msg.id)}
          onToggle={() => toggle(msg.id)}
        />
      ))}
    </div>
  )
}
