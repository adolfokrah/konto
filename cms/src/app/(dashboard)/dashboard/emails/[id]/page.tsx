import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ExternalLink, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { EmailThreadView, type ThreadMessage } from '@/components/dashboard/email-thread-view'
import { InlineReplyBox } from '@/components/dashboard/inline-reply-box'
import { ComposeWindow } from '@/components/dashboard/compose-window'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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

export default async function EmailDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const composeOpen = sp.compose === '1'
  const composeTo = typeof sp.composeTo === 'string' ? sp.composeTo : ''
  const composeSubject = typeof sp.composeSubject === 'string' ? sp.composeSubject : ''
  const replyToEmailId = typeof sp.replyToEmailId === 'string' ? sp.replyToEmailId : ''

  const payload = await getPayload({ config: configPromise })

  let email: any
  try {
    email = await payload.findByID({ collection: 'emails', id, depth: 1, overrideAccess: true })
  } catch {
    notFound()
  }
  if (!email) notFound()

  // Mark as read
  if (email.direction === 'inbound' && !email.isRead) {
    try {
      await payload.update({ collection: 'emails', id, data: { isRead: true }, overrideAccess: true })
    } catch {}
  }

  // Fetch all emails in the thread
  const threadRootId: string = email.threadId || email.id
  const threadResult = await payload.find({
    collection: 'emails',
    where: { or: [{ id: { equals: threadRootId } }, { threadId: { equals: threadRootId } }] },
    sort: 'createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  const threadMessages: ThreadMessage[] = threadResult.docs.map((e: any) => ({
    id: e.id,
    direction: e.direction,
    from: e.from,
    to: e.to ?? [],
    subject: e.subject,
    bodyHtml: e.bodyHtml ?? null,
    bodyText: e.bodyText ?? null,
    status: e.status,
    isRead: e.isRead ?? false,
    createdAt: e.createdAt,
    linkedUser: e.linkedUser && typeof e.linkedUser === 'object'
      ? { id: e.linkedUser.id, firstName: e.linkedUser.firstName ?? '', lastName: e.linkedUser.lastName ?? '', email: e.linkedUser.email ?? '' }
      : null,
  }))

  const subject = email.subject
  const messageCount = threadMessages.length

  // The primary external contact (inbound sender or outbound recipient)
  const primaryAddr = email.direction === 'inbound' ? email.from : (email.to?.[0]?.email ?? '')
  const replyTo = email.direction === 'inbound' ? email.from : (email.to?.[0]?.email ?? '')
  const linkedUser = email.linkedUser && typeof email.linkedUser === 'object' ? email.linkedUser : null

  // Collect all unique participants except "us" (outbound)
  const allAddresses = [
    ...new Set(threadMessages.flatMap(m => [m.from, ...m.to.map(t => t.email)]))
  ]

  const firstDate = threadMessages[0]?.createdAt
  const lastDate = threadMessages[threadMessages.length - 1]?.createdAt

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* ── Left: thread + reply ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
            <Link
              href="/dashboard/emails"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-semibold">{subject}</h1>
                {messageCount > 1 && (
                  <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground tabular-nums">
                    {messageCount}
                  </span>
                )}
              </div>
            </div>

            <Link href={`?compose=1&composeTo=${encodeURIComponent('')}&composeSubject=`}>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Thread messages */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            <div className="mx-auto max-w-2xl px-4 py-6">
              <EmailThreadView messages={threadMessages} />
            </div>
          </div>

          {/* Inline reply box */}
          {replyTo && (
            <div className="shrink-0 border-t bg-card px-4 py-4">
              <div className="mx-auto max-w-2xl">
                <InlineReplyBox to={replyTo} subject={subject} threadId={threadRootId} />
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar: contact info ── */}
        <aside className="w-72 shrink-0 overflow-y-auto border-l">
          {/* Contact */}
          <div className="border-b p-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white',
                avatarColor(primaryAddr),
              )}>
                {getInitials(primaryAddr)}
              </span>
              <div>
                <p className="text-sm font-semibold">{extractName(primaryAddr)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{primaryAddr.replace(/^.*<(.+)>$/, '$1')}</p>
              </div>

              {linkedUser && (
                <Link
                  href={`/dashboard/users/${linkedUser.id}`}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  View platform user
                </Link>
              )}
            </div>
          </div>

          {/* Thread info */}
          <div className="border-b p-4 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Conversation
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages</span>
                <span className="font-medium tabular-nums">{messageCount}</span>
              </div>
              {firstDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-medium">
                    {new Date(firstDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              {lastDate && messageCount > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last reply</span>
                  <span className="font-medium">
                    {new Date(lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Direction</span>
                <span className={cn(
                  'rounded-full px-2 py-px text-[10px] font-semibold capitalize',
                  email.direction === 'inbound'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                )}>
                  {email.direction}
                </span>
              </div>
            </div>
          </div>

          {/* Participants */}
          {allAddresses.length > 1 && (
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Participants
              </p>
              <div className="space-y-2">
                {allAddresses.slice(0, 6).map((addr) => (
                  <div key={addr} className="flex items-center gap-2">
                    <span className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                      avatarColor(addr),
                    )}>
                      {getInitials(addr)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{extractName(addr)}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{addr.replace(/^.*<(.+)>$/, '$1')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {composeOpen && (
        <ComposeWindow
          prefill={{
            to: composeTo || undefined,
            subject: composeSubject || undefined,
            replyToEmailId: replyToEmailId || undefined,
          }}
        />
      )}
    </>
  )
}
