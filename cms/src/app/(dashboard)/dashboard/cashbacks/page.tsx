import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { MetricCard } from '@/components/dashboard/metric-card'
import { CashbacksDataTable } from '@/components/dashboard/cashbacks-data-table'
import { type CashbackRow } from '@/components/dashboard/data-table/columns/cashback-columns'
import { TableCard } from '@/components/dashboard/table-card'
import { PageHeader } from '@/components/dashboard/page-header'

const formatGhs = (n: number) =>
  `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CashbacksPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const jar = typeof params.jar === 'string' ? params.jar : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''
  const order = typeof params.order === 'string' ? params.order : 'desc'
  const sort = order === 'asc' ? 'createdAt' : '-createdAt'

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {}
  if (search) {
    where.contributor = { like: search }
  }
  if (jar) {
    where.jarName = { like: jar }
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  const [result, unpaidResult] = await Promise.all([
    payload.find({
      collection: 'cashbacks' as any,
      where,
      page,
      limit,
      sort,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'cashbacks' as any,
      where: {
        or: [{ isPaid: { equals: false } }, { isPaid: { exists: false } }],
      },
      limit: 0,
      pagination: false,
      overrideAccess: true,
      select: { discountAmount: true } as any,
    }),
  ])

  const cashbacks: CashbackRow[] = (result.docs as any[]).map((c: any) => {
    const userObj = typeof c.user === 'object' && c.user ? c.user : null
    const txObj = typeof c.transaction === 'object' && c.transaction ? c.transaction : null

    return {
      id: c.id,
      transaction: txObj ? { id: txObj.id } : null,
      user: userObj
        ? {
            id: userObj.id,
            firstName: userObj.firstName || '',
            lastName: userObj.lastName || '',
            email: userObj.email || '',
          }
        : null,
      contributor: c.contributor || null,
      jarName: c.jarName || null,
      originalAmount: c.originalAmount ?? 0,
      discountPercent: c.discountPercent ?? 0,
      discountAmount: c.discountAmount ?? 0,
      hogapayRevenue: c.hogapayRevenue ?? 0,
      isPaid: c.isPaid ?? false,
      createdAt: c.createdAt,
    }
  })

  const totalDiscountAmount = (result.docs as any[]).reduce(
    (sum, c) => sum + (c.discountAmount ?? 0),
    0,
  )

  const totalUnpaidCount = unpaidResult.totalDocs
  const totalUnpaidAmount = (unpaidResult.docs as any[]).reduce(
    (sum, c) => sum + (c.discountAmount ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Cashbacks" subtitle="Cashback awarded to contributors" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Total cashbacks" value={result.totalDocs.toLocaleString()} />
        <MetricCard
          title="Discount · this page"
          value={formatGhs(totalDiscountAmount)}
          valueClassName="text-[#0F9F61]"
        />
        <MetricCard
          title="Unpaid cashbacks"
          value={formatGhs(totalUnpaidAmount)}
          valueClassName="text-[#D9840A]"
          description={`${totalUnpaidCount} record${totalUnpaidCount !== 1 ? 's' : ''} unpaid`}
        />
      </div>

      <TableCard
        title="All cashbacks"
        description={
          <>
            {result.totalDocs} cashback record{result.totalDocs !== 1 ? 's' : ''} found
          </>
        }
        className="flex-1 min-h-0"
      >
        <CashbacksDataTable
          cashbacks={cashbacks}
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
