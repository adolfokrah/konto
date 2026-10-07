import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { BusinessVerificationsDataTable } from '@/components/dashboard/business-verifications-data-table'
import { type BusinessVerificationRow } from '@/components/dashboard/data-table/columns/business-verification-columns'
import { TableCard } from '@/components/dashboard/table-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { findUserIdsBySearch, inIds } from '@/utilities/dashboardSearch'
import { MetricCard } from '@/components/dashboard/metric-card'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BusinessVerificationsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await getHeaders()
  await payload.auth({ headers: requestHeaders })

  const where: Record<string, any> = {}

  if (status) {
    const valid = ['pending', 'under-review', 'approved', 'rejected']
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

  if (search) {
    const userIds = await findUserIdsBySearch(payload, search)
    where.or = [inIds('user', userIds), { businessName: { like: search } }]
  }

  const countStatus = (value: string) =>
    payload.count({
      collection: 'business-verifications' as any,
      where: { status: { equals: value } },
      overrideAccess: true,
    })
  const [pendingCount, reviewCount, approvedCount, rejectedCount] = await Promise.all([
    countStatus('pending'),
    countStatus('under-review'),
    countStatus('approved'),
    countStatus('rejected'),
  ])
  const waiting = pendingCount.totalDocs + reviewCount.totalDocs

  const result = await payload.find({
    collection: 'business-verifications' as any,
    where,
    page,
    limit,
    sort: '-createdAt',
    depth: 1,
    overrideAccess: true,
  })

  const docs = result.docs as any[]

  const rows: BusinessVerificationRow[] = docs.map((d: any) => {
    const user = typeof d.user === 'object' && d.user ? d.user : null
    return {
      id: d.id,
      businessName: d.businessName || '—',
      userId: user?.id ?? null,
      userName: user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown'
        : 'Unknown',
      userEmail: user?.email ?? null,
      status: d.status || 'pending',
      createdAt: d.createdAt,
    }
  })

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader
        title="Business verifications"
        subtitle={`${waiting.toLocaleString()} waiting for review`}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Pending" value={pendingCount.totalDocs.toLocaleString()} />
        <MetricCard title="Under review" value={reviewCount.totalDocs.toLocaleString()} />
        <MetricCard title="Approved" value={approvedCount.totalDocs.toLocaleString()} />
        <MetricCard title="Rejected" value={rejectedCount.totalDocs.toLocaleString()} />
      </div>
      <TableCard
        title="All submissions"
        description={
          <>
            {result.totalDocs} verification{result.totalDocs !== 1 ? 's' : ''} found
          </>
        }
        className="flex-1 min-h-0"
      >
        <BusinessVerificationsDataTable
          rows={rows}
          fillParent
          pagination={{
            currentPage: page,
            totalPages: result.totalPages,
            totalRows: result.totalDocs,
            rowsPerPage: limit,
          }}
        />
      </TableCard>
    </div>
  )
}
