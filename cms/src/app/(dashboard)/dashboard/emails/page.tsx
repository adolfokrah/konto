import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Mail, Inbox, Send, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { EmailsDataTable, type EmailRow } from '@/components/dashboard/emails-data-table'

const DEFAULT_LIMIT = 25

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EmailsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const tab = typeof params.tab === 'string' ? params.tab : 'inbox'
  const search = typeof params.search === 'string' ? params.search : ''

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
    payload.find({
      collection: 'emails',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const emails: EmailRow[] = emailsResult.docs.map((e: any) => ({
    id: e.id,
    direction: e.direction,
    from: e.from,
    to: e.to ?? [],
    subject: e.subject,
    bodyText: e.bodyText ?? null,
    status: e.status,
    isRead: e.isRead ?? false,
    linkedUser: e.linkedUser
      ? typeof e.linkedUser === 'object'
        ? {
            id: e.linkedUser.id,
            firstName: e.linkedUser.firstName ?? '',
            lastName: e.linkedUser.lastName ?? '',
            email: e.linkedUser.email ?? '',
          }
        : null
      : null,
    createdAt: e.createdAt,
  }))

  const tabs = [
    { id: 'inbox', label: 'Inbox', count: inboxCount.totalDocs, icon: Inbox },
    { id: 'sent', label: 'Sent', count: sentCount.totalDocs, icon: Send },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MetricCard
            title="Unread"
            value={unreadCount.totalDocs.toLocaleString()}
            icon={Mail}
          />
        </div>
        <Link href="/dashboard/emails/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
              {tabs.map((t) => (
                <Link
                  key={t.id}
                  href={`?tab=${t.id}${search ? `&search=${search}` : ''}`}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                    {t.count}
                  </span>
                </Link>
              ))}
            </div>

            {/* Search */}
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="tab" value={tab} />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search emails..."
                className="h-8 rounded-md border bg-background px-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-52"
              />
              <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                Search
              </Button>
            </form>
          </div>

          <CardDescription className="mt-2">
            {emailsResult.totalDocs} email{emailsResult.totalDocs !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <EmailsDataTable
            emails={emails}
            pagination={{
              currentPage: page,
              totalPages: emailsResult.totalPages,
              totalRows: emailsResult.totalDocs,
              rowsPerPage: limit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
