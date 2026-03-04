import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Bell, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { CampaignsDataTable } from '@/components/dashboard/campaigns-data-table'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PushNotificationsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause
  const where: Record<string, any> = {}
  if (search) {
    where.or = [{ title: { like: search } }, { message: { like: search } }]
  }
  if (status) {
    const valid = ['draft', 'scheduled', 'sending', 'sent', 'failed']
    const values = status.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.status = { equals: values[0] }
    else if (values.length > 1) where.status = { in: values }
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  const [totalSent, campaignsResult] = await Promise.all([
    payload.count({
      collection: 'push-campaigns',
      where: { status: { equals: 'sent' } },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'push-campaigns',
      where,
      page,
      limit,
      sort: '-createdAt',
      overrideAccess: true,
    }),
  ])

  const campaigns = campaignsResult.docs.map((c: any) => ({
    id: c.id,
    title: c.title,
    message: c.message,
    status: c.status,
    targetAudience: c.targetAudience || 'all',
    scheduledFor: c.scheduledFor || null,
    sentAt: c.sentAt || null,
    recipientCount: c.recipientCount || 0,
    successCount: c.successCount || 0,
    failureCount: c.failureCount || 0,
    createdAt: c.createdAt,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Campaigns Sent"
            value={totalSent.totalDocs.toLocaleString()}
            icon={Bell}
          />
        </div>
        <Link href="/dashboard/push-notifications/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Push Campaigns</CardTitle>
          <CardDescription>
            {campaignsResult.totalDocs} campaign{campaignsResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignsDataTable
            campaigns={campaigns}
            pagination={{
              currentPage: page,
              totalPages: campaignsResult.totalPages,
              totalRows: campaignsResult.totalDocs,
              rowsPerPage: limit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
