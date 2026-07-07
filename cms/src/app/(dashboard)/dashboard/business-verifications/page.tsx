import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessVerificationsDataTable } from '@/components/dashboard/business-verifications-data-table'
import { type BusinessVerificationRow } from '@/components/dashboard/data-table/columns/business-verification-columns'

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

  const result = await payload.find({
    collection: 'business-verifications' as any,
    where,
    page,
    limit,
    sort: '-createdAt',
    depth: 1,
    overrideAccess: true,
  })

  let docs = result.docs as any[]

  // Search by business or user name (in-memory, matching disputes pattern)
  if (search) {
    const lower = search.toLowerCase()
    docs = docs.filter((d: any) => {
      const user = typeof d.user === 'object' && d.user ? d.user : null
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').toLowerCase()
      return (
        d.businessName?.toLowerCase().includes(lower) ||
        name.includes(lower) ||
        user?.email?.toLowerCase().includes(lower)
      )
    })
  }

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
    <div className="flex flex-col h-full">
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Business Verifications</CardTitle>
          <CardDescription>
            {result.totalDocs} verification{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
        </CardContent>
      </Card>
    </div>
  )
}
