import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CashbacksDataTable } from '@/components/dashboard/cashbacks-data-table'
import { type CashbackRow } from '@/components/dashboard/data-table/columns/cashback-columns'

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
    <div className="flex flex-col gap-6 h-full">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cashbacks</CardDescription>
            <CardTitle className="text-2xl">{result.totalDocs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Discount (this page)</CardDescription>
            <CardTitle className="text-2xl text-green-400">
              GHS {totalDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unpaid Cashbacks</CardDescription>
            <CardTitle className="text-2xl text-yellow-400">
              GHS {totalUnpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 pt-0">
            <p className="text-xs text-muted-foreground">{totalUnpaidCount} record{totalUnpaidCount !== 1 ? 's' : ''} unpaid</p>
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Cashbacks</CardTitle>
          <CardDescription>
            {result.totalDocs} cashback record{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <CashbacksDataTable
            cashbacks={cashbacks}
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
