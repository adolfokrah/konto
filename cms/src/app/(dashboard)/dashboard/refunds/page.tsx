import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefundsDataTable } from '@/components/dashboard/refunds-data-table'
import { ExportRefundsButton } from '@/components/dashboard/export-refunds-button'
import { type RefundRow } from '@/components/dashboard/data-table/columns/refund-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function RefundsPage({ searchParams }: Props) {
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
    where.accountName = { like: search }
  }
  if (status) {
    const valid = ['pending', 'in-progress', 'completed', 'failed']
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

  const refundsResult = await payload.find({
    collection: 'refunds' as any,
    where,
    page,
    limit,
    sort: '-createdAt',
    depth: 2,
    overrideAccess: true,
  })

  const refunds: RefundRow[] = (refundsResult.docs as any[]).map((r: any) => {
    const jarObj = typeof r.jar === 'object' && r.jar ? r.jar : null
    const initiatedByObj = typeof r.initiatedBy === 'object' && r.initiatedBy ? r.initiatedBy : null
    const linkedTxObj = typeof r.linkedTransaction === 'object' && r.linkedTransaction ? r.linkedTransaction : null

    return {
      id: r.id,
      initiatedBy: initiatedByObj
        ? {
            id: initiatedByObj.id,
            firstName: initiatedByObj.firstName || '',
            lastName: initiatedByObj.lastName || '',
            email: initiatedByObj.email || '',
          }
        : null,
      amount: r.amount || 0,
      accountNumber: r.accountNumber || '',
      accountName: r.accountName || '',
      mobileMoneyProvider: r.mobileMoneyProvider || '',
      jar: jarObj ? { id: jarObj.id, name: jarObj.name, currency: jarObj.currency || 'GHS' } : null,
      linkedTransaction: linkedTxObj
        ? { id: linkedTxObj.id, contributor: linkedTxObj.contributor || '' }
        : null,
      eganowFees: r.eganowFees || 0,
      hogapayRevenue: r.hogapayRevenue || 0,
      transactionReference: r.transactionReference || null,
      status: r.status || 'pending',
      createdAt: r.createdAt,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Refunds</CardTitle>
              <CardDescription>
                {refundsResult.totalDocs} refund{refundsResult.totalDocs !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <ExportRefundsButton />
          </div>
        </CardHeader>
        <CardContent>
          <RefundsDataTable
            refunds={refunds}
            pagination={{
              currentPage: page,
              totalPages: refundsResult.totalPages,
              totalRows: refundsResult.totalDocs,
              rowsPerPage: limit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
