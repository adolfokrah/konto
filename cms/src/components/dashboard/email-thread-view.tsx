'use client'

import Link from 'next/link'
import { ExternalLink, Paperclip, Download } from 'lucide-react'
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
  attachments?: { filename: string; contentType?: string | null; content?: string | null }[]
}

function extractName(addr: string): string {
  const m = addr.match(/^([^<]+)</)
  const raw = m ? m[1].trim() : addr.split('@')[0]
  return raw.replace(/[._-]/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function extractEmail(addr: string): string {
  const m = addr.match(/<(.+)>$/)
  return m ? m[1] : addr
}

function getInitials(addr: string): string {
  const name = extractName(addr)
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

import { AVATAR_COLORS, extractBareEmail, buildColorMap } from '@/utilities/avatarColors'

function getColor(addr: string, colorMap: Map<string, string>): string {
  return colorMap.get(extractBareEmail(addr)) ?? AVATAR_COLORS[0]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function downloadAttachment(filename: string, contentType: string, content: string) {
  const byteChars = atob(content)
  const byteNums = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
  const blob = new Blob([new Uint8Array(byteNums)], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function AttachmentList({ attachments }: { attachments: ThreadMessage['attachments'] }) {
  if (!attachments?.length) return null
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {attachments.map((att, i) => (
        <button
          key={i}
          onClick={() => {
            if (att.content) {
              downloadAttachment(att.filename, att.contentType ?? 'application/octet-stream', att.content)
            }
          }}
          disabled={!att.content}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-default disabled:opacity-50"
        >
          <Paperclip className="h-3 w-3 text-gray-400 shrink-0" />
          <span className="max-w-[180px] truncate">{att.filename}</span>
          {att.content && <Download className="h-3 w-3 text-gray-400 shrink-0" />}
        </button>
      ))}
    </div>
  )
}

function MessageBlock({ msg, colorMap }: { msg: ThreadMessage; colorMap: Map<string, string> }) {
  const name = extractName(msg.from)
  const email = extractEmail(msg.from)

  return (
    <div className="px-6 py-5">
      {/* Sender */}
      <div className="flex items-start gap-3 mb-4">
        <span className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5',
          getColor(msg.from, colorMap),
        )}>
          {getInitials(msg.from)}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{name}</span>
            {msg.direction === 'outbound' && (
              <span className="rounded px-1.5 py-px text-[10px] font-semibold bg-gray-100 text-gray-500">
                Staff
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            <span className="text-gray-300">From</span>{'  '}{email}
          </p>
          <p className="text-xs text-gray-400">{formatDate(msg.createdAt)}</p>
        </div>
      </div>

      {/* Body — full width, no indent */}
      <EmailBodyViewer html={msg.bodyHtml} text={msg.bodyText} />

      {/* Attachments */}
      <AttachmentList attachments={msg.attachments} />

      {msg.linkedUser && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link
            href={`/dashboard/users/${msg.linkedUser.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View {msg.linkedUser.firstName || msg.linkedUser.email} on platform
          </Link>
        </div>
      )}
    </div>
  )
}

export function EmailThreadView({ messages }: { messages: ThreadMessage[] }) {
  const colorMap = buildColorMap(messages)
  return (
    <div className="divide-y divide-gray-100">
      {messages.map(msg => (
        <MessageBlock key={msg.id} msg={msg} colorMap={colorMap} />
      ))}
    </div>
  )
}
