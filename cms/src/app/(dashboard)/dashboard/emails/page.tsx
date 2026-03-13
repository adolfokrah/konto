import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Inbox, Send, Plus, Search } from 'lucide-react'
import { EmailsDataTable, type EmailRow } from '@/components/dashboard/emails-data-table'
import { ComposeWindow } from '@/components/dashboard/compose-window'

const DEFAULT_LIMIT = 50

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EmailsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const tab = typeof params.tab === 'string' ? params.tab : 'inbox'
  const search = typeof params.search === 'string' ? params.search : ''

  // Compose window params
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

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: inboxCount.totalDocs, unread: unreadCount.totalDocs },
    { id: 'sent', label: 'Sent', icon: Send, count: sentCount.totalDocs, unread: 0 },
  ]

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Sidebar */}
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              Receiving at
            </p>
            <p className="text-[11px] font-medium text-foreground/70 break-all">
              support@hogapay.com
            </p>
          </div>
        </aside>

        {/* Main panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 border-b px-4 py-2">
            <form method="GET" className="flex flex-1 items-center gap-2">
              <input type="hidden" name="tab" value={tab} />
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="search"
                  defaultValue={search}
                  placeholder={`Search ${tab === 'inbox' ? 'inbox' : 'sent'}…`}
                  className="h-8 w-full rounded-full border bg-muted/50 pl-8 pr-3 text-xs placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              {search && (
                <Link href={`?tab=${tab}`} className="text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </Link>
              )}
            </form>
            <span className="text-xs tabular-nums text-muted-foreground/60">
              {emailsResult.totalDocs} {emailsResult.totalDocs === 1 ? 'thread' : 'threads'}
            </span>
          </div>

          {/* List */}
          <div className="flex-1 overflow-hidden">
            <EmailsDataTable
              emails={threads}
              tab={tab}
              pagination={{ currentPage: page, totalPages: emailsResult.totalPages, totalRows: emailsResult.totalDocs, rowsPerPage: limit }}
            />
          </div>
        </div>
      </div>

      {/* Floating compose window */}
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
