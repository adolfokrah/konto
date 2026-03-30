import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { MessageSquare, Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { SmsCampaignsDataTable } from '@/components/dashboard/sms-campaigns-data-table'
import { type SmsCampaignRow } from '@/components/dashboard/data-table/columns/sms-campaign-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SmsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {}
  if (search) {
    where.message = { like: search }
  }
  if (status) {
    const valid = ['draft', 'sending', 'sent', 'failed']
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

  const [totalSent, result] = await Promise.all([
    payload.count({
      collection: 'sms-campaigns',
      where: { status: { equals: 'sent' } },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'sms-campaigns',
      where,
      page,
      limit,
      sort: '-createdAt',
      overrideAccess: true,
    }),
  ])

  const campaigns: SmsCampaignRow[] = result.docs.map((c: any) => ({
    id: c.id,
    message: c.message,
    status: c.status,
    targetAudience: c.targetAudience || 'all',
    sentAt: c.sentAt || null,
    recipientCount: c.recipientCount || 0,
    successCount: c.successCount || 0,
    failureCount: c.failureCount || 0,
    createdAt: c.createdAt,
  }))

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div className="w-[220px]">
          <MetricCard
            title="SMS Sent"
            value={totalSent.totalDocs.toLocaleString()}
            icon={MessageSquare}
          />
        </div>
        <Link href="/dashboard/sms/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New SMS
          </Button>
        </Link>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>SMS Campaigns</CardTitle>
          <CardDescription>
            {result.totalDocs} campaign{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <SmsCampaignsDataTable
            campaigns={campaigns}
            fillParent
            pagination={{
              currentPage: page,
              totalPages: result.totalPages,
              totalRows: result.totalDocs,
              rowsPerPage: limit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
