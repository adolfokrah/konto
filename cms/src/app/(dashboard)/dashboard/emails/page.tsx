import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Inbox, Send, Plus, Search, ExternalLink } from 'lucide-react'
import { EmailsDataTable, type EmailRow } from '@/components/dashboard/emails-data-table'
import { ComposeWindow } from '@/components/dashboard/compose-window'
import { SyncEmailsButton } from '@/components/dashboard/sync-emails-button'
import { EmailThreadView, type ThreadMessage } from '@/components/dashboard/email-thread-view'
import { buildColorMap, extractBareEmail, hashColor } from '@/utilities/avatarColors'
import { InlineReplyBox } from '@/components/dashboard/inline-reply-box'
import { cn } from '@/utilities/ui'

const DEFAULT_LIMIT = 50

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

function avatarColor(addr: string, colorMap?: Map<string, string>): string {
  if (colorMap) return colorMap.get(extractBareEmail(addr)) ?? hashColor(addr)
  return hashColor(addr)
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EmailsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const tab = typeof params.tab === 'string' ? params.tab : 'inbox'
  const search = typeof params.search === 'string' ? params.search : ''
  const emailId = typeof params.emailId === 'string' ? params.emailId : null

  const composeOpen = params.compose === '1'
  const composeTo = typeof params.composeTo === 'string' ? params.composeTo : ''
  const composeSubject = typeof params.composeSubject === 'string' ? params.composeSubject : ''
  const replyToEmailId = typeof params.replyToEmailId === 'string' ? params.replyToEmailId : ''

  const payload = await getPayload({ config: configPromise })

  const direction = tab === 'sent' ? 'outbound' : 'inbound'
  const where: Record<string, any> = { direction: { equals: direction } }
  if (search) {
    where.or = [
      { subject: { like: search } },
      { from: { like: search } },
      { bodyText: { like: search } },
    ]
  }

  const [inboxCount, unreadCount, sentCount, emailsResult] = await Promise.all([
    payload.count({ collection: 'emails', where: { direction: { equals: 'inbound' } }, overrideAccess: true }),
    payload.count({ collection: 'emails', where: { direction: { equals: 'inbound' }, isRead: { equals: false } }, overrideAccess: true }),
    payload.count({ collection: 'emails', where: { direction: { equals: 'outbound' } }, overrideAccess: true }),
    payload.find({ collection: 'emails', where, page, limit, sort: '-createdAt', depth: 1, overrideAccess: true }),
  ])

  // Group into threads
  const threadMap = new Map<string, { emails: any[]; latest: any }>()
  for (const e of emailsResult.docs) {
    const key: string = e.threadId || e.id
    const entry = threadMap.get(key)
    if (!entry) {
      threadMap.set(key, { emails: [e], latest: e })
    } else {
      entry.emails.push(e)
      if (new Date(e.createdAt) > new Date(entry.latest.createdAt)) entry.latest = e
    }
  }

  const threads: EmailRow[] = Array.from(threadMap.values())
    .sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime())
    .map(({ emails, latest: e }) => ({
      id: e.id,
      threadId: e.threadId || e.id,
      direction: e.direction,
      from: e.from,
      to: e.to ?? [],
      subject: e.subject,
      bodyText: e.bodyText ?? null,
      status: e.status,
      isRead: emails.every((m: any) => m.isRead),
      linkedUser: e.linkedUser && typeof e.linkedUser === 'object'
        ? { id: e.linkedUser.id, firstName: e.linkedUser.firstName ?? '', lastName: e.linkedUser.lastName ?? '', email: e.linkedUser.email ?? '' }
        : null,
      createdAt: e.createdAt,
      messageCount: emails.length,
      participants: [...new Set(emails.flatMap((m: any) => [m.from, ...(m.to ?? []).map((t: any) => t.email)]))],
    }))

  // Fetch selected email + its thread
  let selectedEmail: any = null
  let threadMessages: ThreadMessage[] = []
  if (emailId) {
    try {
      selectedEmail = await payload.findByID({ collection: 'emails', id: emailId, depth: 1, overrideAccess: true })
      const threadRootId: string = selectedEmail.threadId || selectedEmail.id
      const threadResult = await payload.find({
        collection: 'emails',
        where: { or: [{ id: { equals: threadRootId } }, { threadId: { equals: threadRootId } }] },
        sort: 'createdAt',
        limit: 100,
        depth: 1,
        overrideAccess: true,
      })
      // Mark all unread inbound messages in the thread as read
      await Promise.all(
        threadResult.docs
          .filter((e: any) => e.direction === 'inbound' && !e.isRead)
          .map((e: any) => payload.update({ collection: 'emails', id: e.id, data: { isRead: true }, overrideAccess: true }).catch(() => {}))
      )
      threadMessages = threadResult.docs.map((e: any) => ({
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
        resendEmailId: e.resendEmailId ?? null,
        linkedUser: e.linkedUser && typeof e.linkedUser === 'object'
          ? { id: e.linkedUser.id, firstName: e.linkedUser.firstName ?? '', lastName: e.linkedUser.lastName ?? '', email: e.linkedUser.email ?? '' }
          : null,
        attachments: Array.isArray(e.attachments) ? e.attachments.map((a: any) => ({
          filename: a.filename ?? 'attachment',
          contentType: a.contentType ?? null,
        })) : [],
      }))
    } catch {}
  }

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: inboxCount.totalDocs, unread: unreadCount.totalDocs },
    { id: 'sent', label: 'Sent', icon: Send, count: sentCount.totalDocs, unread: 0 },
  ]

  const primaryAddr = selectedEmail
    ? (selectedEmail.direction === 'inbound' ? selectedEmail.from : (selectedEmail.to?.[0]?.email ?? ''))
    : ''
  const replyTo = primaryAddr
  const linkedUser = selectedEmail?.linkedUser && typeof selectedEmail.linkedUser === 'object'
    ? selectedEmail.linkedUser : null
  const allAddresses = selectedEmail
    ? [...new Set(threadMessages.flatMap(m => [m.from, ...m.to.map(t => t.email)]))] as string[]
    : []
  const threadRootId = selectedEmail ? (selectedEmail.threadId || selectedEmail.id) : ''
  const threadColorMap = threadMessages.length > 0 ? buildColorMap(threadMessages) : undefined

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem-2rem)] lg:h-[calc(100vh-3.5rem-3rem)] max-h-full overflow-hidden rounded-xl border bg-card shadow-sm">

        {/* ── Nav sidebar ── */}
        <aside className="flex w-52 shrink-0 flex-col border-r">
          <div className="p-3">
            <Link
              href={`?tab=${tab}&compose=1`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Compose
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5 px-2 pb-3">
            {folders.map((f) => (
              <Link
                key={f.id}
                href={`?tab=${f.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  tab === f.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <f.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{f.label}</span>
                {f.unread > 0 ? (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground tabular-nums">
                    {f.unread}
                  </span>
                ) : f.count > 0 ? (
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">{f.count}</span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="border-t p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Receiving at</p>
            <p className="text-[11px] font-medium text-foreground/70 break-all">support@hogapay.com</p>
          </div>
        </aside>

        {/* ── Email list ── */}
        <div className={cn(
          'flex flex-col border-r overflow-hidden',
          selectedEmail ? 'w-72 shrink-0' : 'flex-1',
        )}>
          <div className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
            <form method="GET" className="flex flex-1 items-center gap-2">
              <input type="hidden" name="tab" value={tab} />
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Search…"
                  className="h-8 w-full rounded-full border bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {search && (
                <Link href={`?tab=${tab}`} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">Clear</Link>
              )}
            </form>
            {tab === 'inbox' && <SyncEmailsButton />}
          </div>

          <div className="flex-1 overflow-hidden">
            <EmailsDataTable
              emails={threads}
              tab={tab}
              activeId={emailId ?? undefined}
              pagination={{ currentPage: page, totalPages: emailsResult.totalPages, totalRows: emailsResult.totalDocs, rowsPerPage: limit }}
            />
          </div>
        </div>

        {/* ── Thread detail ── */}
        {selectedEmail ? (
          <>
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3.5 shrink-0">
                <h1 className="flex-1 truncate text-sm font-semibold text-gray-900">{selectedEmail.subject}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                  {threadMessages.length > 1 && (
                    <span className="rounded border border-gray-200 bg-gray-50 px-1.5 py-px text-[10px] font-medium text-gray-400 tabular-nums">
                      {threadMessages.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white">
                <EmailThreadView messages={threadMessages} />
              </div>

              {replyTo && (
                <div className="shrink-0 border-t border-gray-200 bg-white">
                  <InlineReplyBox to={replyTo} subject={selectedEmail.subject} threadId={threadRootId} />
                </div>
              )}
            </div>

            {/* ── Contact sidebar ── */}
            <aside className="w-64 shrink-0 overflow-y-auto border-l">
              <div className="border-b p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white', avatarColor(primaryAddr, threadColorMap))}>
                    {getInitials(primaryAddr)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{extractName(primaryAddr)}</p>
                    <p className="mt-0.5 break-all text-xs text-muted-foreground">{primaryAddr.replace(/^.*<(.+)>$/, '$1')}</p>
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

              <div className="border-b p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Conversation</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium tabular-nums">{threadMessages.length}</span>
                  </div>
                  {threadMessages[0] && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium">
                        {new Date(threadMessages[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Direction</span>
                    <span className={cn(
                      'rounded-full px-2 py-px text-[10px] font-semibold capitalize',
                      selectedEmail.direction === 'inbound'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                    )}>
                      {selectedEmail.direction}
                    </span>
                  </div>
                </div>
              </div>

              {allAddresses.length > 0 && (
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Participants</p>
                  <div className="space-y-2">
                    {allAddresses.slice(0, 6).map((addr) => (
                      <div key={addr} className="flex items-center gap-2">
                        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', avatarColor(addr, threadColorMap))}>
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
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-10" />
            <p className="text-sm">Select a conversation</p>
          </div>
        )}
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
