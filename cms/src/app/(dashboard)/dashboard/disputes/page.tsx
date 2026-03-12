import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DisputesDataTable } from '@/components/dashboard/disputes-data-table'
import { type DisputeRow } from '@/components/dashboard/data-table/columns/dispute-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DisputesPage({ searchParams }: Props) {
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
    const valid = ['open', 'under-review', 'resolved', 'rejected']
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

  // Search by user name requires joining — filter in memory after fetch if search provided
  const result = await payload.find({
    collection: 'disputes' as any,
    where,
    page,
    limit,
    sort: '-createdAt',
    depth: 2,
    overrideAccess: true,
  })

  let docs = result.docs as any[]

  if (search) {
    const lower = search.toLowerCase()
    docs = docs.filter((d: any) => {
      const user = typeof d.raisedBy === 'object' && d.raisedBy ? d.raisedBy : null
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').toLowerCase()
      return name.includes(lower) || d.description?.toLowerCase().includes(lower)
    })
  }

  const disputes: DisputeRow[] = docs.map((d: any) => {
    const user = typeof d.raisedBy === 'object' && d.raisedBy ? d.raisedBy : null
    const resolver = typeof d.resolvedBy === 'object' && d.resolvedBy ? d.resolvedBy : null
    const tx = typeof d.transaction === 'object' && d.transaction ? d.transaction : null

    return {
      id: d.id,
      transactionId: tx?.id ?? null,
      raisedById: user?.id ?? null,
      raisedByName: user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown'
        : 'Unknown',
      resolvedById: resolver?.id ?? null,
      resolvedByName: resolver
        ? [resolver.firstName, resolver.lastName].filter(Boolean).join(' ') || resolver.email || null
        : null,
      description: d.description || '',
      status: d.status || 'open',
      createdAt: d.createdAt,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
          <CardDescription>
            {result.totalDocs} dispute{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisputesDataTable
            disputes={disputes}
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
