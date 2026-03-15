'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Paperclip, Download } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { EmailBodyViewer } from '@/components/dashboard/email-body-viewer'
import { ImageViewer } from '@/components/ui/image-viewer'

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
  resendEmailId?: string | null
  linkedUser: { id: string; firstName: string; lastName: string; email: string; photoUrl?: string | null } | null
  attachments?: { filename: string; contentType?: string | null }[]
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

function isImage(contentType?: string | null) {
  return !!(contentType && contentType.startsWith('image/'))
}

function AttachmentList({ attachments, resendEmailId, direction }: { attachments: ThreadMessage['attachments']; resendEmailId?: string | null; direction: string }) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  if (!attachments?.length) return null

  const images = attachments.filter((a) => isImage(a.contentType))
  const files = attachments.filter((a) => !isImage(a.contentType))

  const attUrl = (idx: number, filename?: string) =>
    resendEmailId
      ? `/api/email-attachment?emailId=${encodeURIComponent(resendEmailId)}&index=${idx}&direction=${direction}${filename ? `&filename=${encodeURIComponent(filename)}` : ''}`
      : null

  const imageViewerImages = images.map((att) => ({
    url: attUrl(attachments.indexOf(att), att.filename) ?? '',
    alt: att.filename,
  })).filter((img) => img.url)

  return (
    <div className="mt-4 space-y-3">
      {/* Inline image previews */}
      {images.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {images.map((att, i) => {
              const idx = attachments.indexOf(att)
              const url = attUrl(idx, att.filename)
              if (!url) return null
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setViewerIndex(i); setViewerOpen(true) }}
                  className="block text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={att.filename}
                    className="max-h-64 max-w-xs rounded-lg border border-gray-200 object-contain shadow-sm transition-opacity hover:opacity-90 cursor-zoom-in"
                    onError={(e) => { (e.currentTarget.closest('button') as HTMLElement | null)?.remove() }}
                  />
                  <p className="mt-1 text-[10px] text-gray-400 truncate max-w-xs">{att.filename}</p>
                </button>
              )
            })}
          </div>
          <ImageViewer
            images={imageViewerImages}
            initialIndex={viewerIndex}
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
          />
        </>
      )}

      {/* File download chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((att, i) => {
            const idx = attachments.indexOf(att)
            const url = attUrl(idx, att.filename)
            return (
              <a
                key={i}
                href={url ?? '#'}
                download={att.filename}
                onClick={!url ? (e) => e.preventDefault() : undefined}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Paperclip className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="max-w-[180px] truncate">{att.filename}</span>
                {url && <Download className="h-3 w-3 text-gray-400 shrink-0" />}
              </a>
            )
          })}
        </div>
      )}
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
        {msg.direction === 'inbound' && msg.linkedUser?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={msg.linkedUser.photoUrl} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover mt-0.5" />
        ) : (
          <span className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5',
            getColor(msg.from, colorMap),
          )}>
            {getInitials(msg.from)}
          </span>
        )}
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
      <AttachmentList attachments={msg.attachments} resendEmailId={msg.resendEmailId} direction={msg.direction} />

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
