import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionsDataTable } from '@/components/dashboard/transactions-data-table'
import { type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const type = typeof params.type === 'string' ? params.type : ''
  const method = typeof params.method === 'string' ? params.method : ''
  const link = typeof params.link === 'string' ? params.link : ''
  const settled = typeof params.settled === 'string' ? params.settled : ''
  const ref = typeof params.ref === 'string' ? params.ref : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause from filters (supports comma-separated multi-select)
  const where: Record<string, any> = {}
  if (search) {
    where.contributor = { like: search }
  }
  if (status) {
    const valid = ['pending', 'completed', 'failed', 'transferred']
    const values = status.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.paymentStatus = { equals: values[0] }
    else if (values.length > 1) where.paymentStatus = { in: values }
  }
  if (type) {
    const valid = ['contribution', 'payout']
    const values = type.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.type = { equals: values[0] }
    else if (values.length > 1) where.type = { in: values }
  }
  if (method) {
    const valid = ['mobile-money', 'cash', 'bank', 'card', 'apple-pay']
    const values = method.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.paymentMethod = { equals: values[0] }
    else if (values.length > 1) where.paymentMethod = { in: values }
  }
  if (link && ['yes', 'no'].includes(link)) {
    where.viaPaymentLink = { equals: link === 'yes' }
  }
  if (settled && ['yes', 'no'].includes(settled)) {
    where.isSettled = { equals: settled === 'yes' }
  }
  if (ref) {
    where.transactionReference = { like: ref }
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    // Set to end of day
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  const transactionsResult = await payload.find({
    collection: 'transactions',
    where,
    page,
    limit,
    sort: '-createdAt',
    depth: 1,
    overrideAccess: true,
  })

  // Map to TransactionRow type
  const transactions: TransactionRow[] = transactionsResult.docs.map((tx: any) => {
    const jarObj = typeof tx.jar === 'object' && tx.jar ? tx.jar : null
    const collectorObj = typeof tx.collector === 'object' && tx.collector ? tx.collector : null

    return {
      id: tx.id,
      contributor: tx.contributor || null,
      contributorPhoneNumber: tx.contributorPhoneNumber || null,
      jar: jarObj ? { id: jarObj.id, name: jarObj.name } : null,
      paymentMethod: tx.paymentMethod || null,
      mobileMoneyProvider: tx.mobileMoneyProvider || null,
      accountNumber: tx.accountNumber || null,
      amountContributed: tx.amountContributed || 0,
      chargesBreakdown: tx.chargesBreakdown || null,
      paymentStatus: tx.paymentStatus || 'pending',
      type: tx.type,
      isSettled: tx.isSettled ?? false,
      payoutFeePercentage: tx.payoutFeePercentage ?? null,
      payoutFeeAmount: tx.payoutFeeAmount ?? null,
      payoutNetAmount: tx.payoutNetAmount ?? null,
      transactionReference: tx.transactionReference || null,
      collector: collectorObj
        ? {
            id: collectorObj.id,
            firstName: collectorObj.firstName || '',
            lastName: collectorObj.lastName || '',
            email: collectorObj.email || '',
          }
        : null,
      viaPaymentLink: tx.viaPaymentLink ?? false,
      createdAt: tx.createdAt,
    }
  })

  return (
    <div className="space-y-6">
      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {transactionsResult.totalDocs} transaction{transactionsResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsDataTable
            transactions={transactions}
            pagination={{ currentPage: page, totalPages: transactionsResult.totalPages, totalRows: transactionsResult.totalDocs, rowsPerPage: limit }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
