import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Inbox, Send, Plus } from 'lucide-react'
import { EmailsDataTable, type EmailRow } from '@/components/dashboard/emails-data-table'
import { ComposeWindow } from '@/components/dashboard/compose-window'
import { SyncEmailsButton } from '@/components/dashboard/sync-emails-button'
import { EmailThreadView, type ThreadMessage } from '@/components/dashboard/email-thread-view'
import { buildColorMap, extractBareEmail, hashColor } from '@/utilities/avatarColors'
import { InlineReplyBox } from '@/components/dashboard/inline-reply-box'
import { EmailThreadPanel } from '@/components/dashboard/email-thread-panel'
import { EmailSearchInput } from '@/components/dashboard/email-search-input'
import { AdminOnly } from '@/components/dashboard/dashboard-user-context'
import { cn } from '@/utilities/ui'

const DEFAULT_LIMIT = 50

function extractName(addr: string): string {
  const m = addr.match(/^([^<]+)</)
  const raw = m ? m[1].trim() : addr.split('@')[0]
  return raw
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
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
      { 'to.email': { like: search } },
      { bodyText: { like: search } },
    ]
  }

  const [inboxCount, unreadCount, sentCount, emailsResult] = await Promise.all([
    payload.count({
      collection: 'emails',
      where: { direction: { equals: 'inbound' } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'emails',
      where: { direction: { equals: 'inbound' }, isRead: { equals: false } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'emails',
      where: { direction: { equals: 'outbound' } },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'emails',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 2,
      overrideAccess: true,
    }),
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
      linkedUser:
        e.linkedUser && typeof e.linkedUser === 'object'
          ? {
              id: e.linkedUser.id,
              firstName: e.linkedUser.firstName ?? '',
              lastName: e.linkedUser.lastName ?? '',
              email: e.linkedUser.email ?? '',
              photoUrl:
                typeof e.linkedUser.photo === 'object' && e.linkedUser.photo?.url
                  ? e.linkedUser.photo.url
                  : null,
            }
          : null,
      createdAt: e.createdAt,
      messageCount: emails.length,
      participants: [
        ...new Set(emails.flatMap((m: any) => [m.from, ...(m.to ?? []).map((t: any) => t.email)])),
      ],
    }))

  // Fetch selected email + its thread
  let selectedEmail: any = null
  let threadMessages: ThreadMessage[] = []
  if (emailId) {
    try {
      selectedEmail = await payload.findByID({
        collection: 'emails',
        id: emailId,
        depth: 2,
        overrideAccess: true,
      })
      const threadRootId: string = selectedEmail.threadId || selectedEmail.id
      const threadResult = await payload.find({
        collection: 'emails',
        where: { or: [{ id: { equals: threadRootId } }, { threadId: { equals: threadRootId } }] },
        sort: 'createdAt',
        limit: 100,
        depth: 2,
        overrideAccess: true,
      })
      // Mark all unread inbound messages in the thread as read
      await Promise.all(
        threadResult.docs
          .filter((e: any) => e.direction === 'inbound' && !e.isRead)
          .map((e: any) =>
            payload
              .update({
                collection: 'emails',
                id: e.id,
                data: { isRead: true },
                overrideAccess: true,
              })
              .catch(() => {}),
          ),
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
        linkedUser:
          e.linkedUser && typeof e.linkedUser === 'object'
            ? {
                id: e.linkedUser.id,
                firstName: e.linkedUser.firstName ?? '',
                lastName: e.linkedUser.lastName ?? '',
                email: e.linkedUser.email ?? '',
                photoUrl:
                  typeof e.linkedUser.photo === 'object' && e.linkedUser.photo?.url
                    ? e.linkedUser.photo.url
                    : null,
              }
            : null,
        attachments: Array.isArray(e.attachments)
          ? e.attachments.map((a: any) => ({
              filename: a.filename ?? 'attachment',
              contentType: a.contentType ?? null,
            }))
          : [],
      }))
    } catch {}
  }

  const folders = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      count: inboxCount.totalDocs,
      unread: unreadCount.totalDocs,
    },
    { id: 'sent', label: 'Sent', icon: Send, count: sentCount.totalDocs, unread: 0 },
  ]

  const primaryAddr = selectedEmail
    ? selectedEmail.direction === 'inbound'
      ? selectedEmail.from
      : (selectedEmail.to?.[0]?.email ?? '')
    : ''
  const replyTo = primaryAddr
  const linkedUser =
    selectedEmail?.linkedUser && typeof selectedEmail.linkedUser === 'object'
      ? {
          ...selectedEmail.linkedUser,
          photoUrl:
            typeof selectedEmail.linkedUser.photo === 'object' &&
            selectedEmail.linkedUser.photo?.url
              ? selectedEmail.linkedUser.photo.url
              : null,
        }
      : null
  const allAddresses = selectedEmail
    ? ([
        ...new Set(threadMessages.flatMap((m) => [m.from, ...m.to.map((t) => t.email)])),
      ] as string[])
    : []
  const threadRootId = selectedEmail ? selectedEmail.threadId || selectedEmail.id : ''
  const threadColorMap = threadMessages.length > 0 ? buildColorMap(threadMessages) : undefined

  return (
    <>
      <div className="flex h-[calc(100vh-60px-2rem)] max-h-full gap-3 overflow-hidden lg:h-[calc(100vh-60px-3rem)]">
        {/* ── Nav sidebar ── */}
        <aside className="flex w-44 shrink-0 flex-col">
          <AdminOnly>
            <div className="pb-3">
              <Link
                href={`?tab=${tab}&compose=1`}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1B232E] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Compose
              </Link>
            </div>
          </AdminOnly>

          <nav className="flex-1 space-y-0.5 pb-3">
            {folders.map((f) => (
              <Link
                key={f.id}
                href={`?tab=${f.id}`}
                className={`flex h-9 items-center gap-2.5 rounded-[10px] px-3 text-[13px] transition-colors ${
                  tab === f.id
                    ? 'bg-[#D9F57A] font-semibold text-[#1B232E]'
                    : 'font-medium text-foreground hover:bg-secondary'
                }`}
              >
                <f.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{f.label}</span>
                {f.unread > 0 ? (
                  <span className="rounded-md bg-[#1B232E] px-1.5 py-px text-[10.5px] font-semibold tabular-nums text-[#D9F57A]">
                    {f.unread}
                  </span>
                ) : f.count > 0 ? (
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">
                    {f.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="space-y-1 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
              Receiving at
            </p>
            <p className="text-[11px] font-medium text-foreground/70 break-all">
              support@hogapay.com
            </p>
          </div>
        </aside>

        {/* ── Email list ── */}
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-2xl bg-card',
            selectedEmail ? 'w-72 shrink-0' : 'flex-1',
          )}
        >
          <div className="flex shrink-0 items-center gap-2 p-3">
            <div className="flex-1">
              <EmailSearchInput tab={tab} defaultValue={search} />
            </div>
            {tab === 'inbox' && <SyncEmailsButton />}
          </div>

          <div className="flex-1 overflow-hidden">
            <EmailsDataTable
              emails={threads}
              tab={tab}
              activeId={emailId ?? undefined}
              pagination={{
                currentPage: page,
                totalPages: emailsResult.totalPages,
                totalRows: emailsResult.totalDocs,
                rowsPerPage: limit,
              }}
            />
          </div>
        </div>

        {/* ── Thread detail ── */}
        {selectedEmail ? (
          <EmailThreadPanel
            subject={selectedEmail.subject}
            isActive
            messageCount={threadMessages.length}
            direction={selectedEmail.direction}
            body={<EmailThreadView messages={threadMessages} />}
            replyBox={
              replyTo ? (
                <InlineReplyBox
                  to={replyTo}
                  subject={selectedEmail.subject}
                  threadId={threadRootId}
                />
              ) : null
            }
            sidebarProps={{
              primaryAddr: primaryAddr.replace(/^.*<(.+)>$/, '$1'),
              primaryInitials: getInitials(primaryAddr),
              primaryColor: avatarColor(primaryAddr, threadColorMap),
              primaryName: extractName(primaryAddr),
              linkedUser,
              messageCount: threadMessages.length,
              startedDate: threadMessages[0]
                ? new Date(threadMessages[0].createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : '',
              direction: selectedEmail.direction,
              allAddresses: allAddresses.map((addr) => ({
                addr,
                initials: getInitials(addr),
                color: avatarColor(addr, threadColorMap),
                name: extractName(addr),
                bare: addr.replace(/^.*<(.+)>$/, '$1'),
              })),
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-card text-muted-foreground">
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
