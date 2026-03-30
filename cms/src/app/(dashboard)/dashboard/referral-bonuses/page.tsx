import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReferralBonusesDataTable } from '@/components/dashboard/referral-bonuses-data-table'
import { type ReferralBonusRow } from '@/components/dashboard/data-table/columns/referral-bonus-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReferralBonusesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const id = typeof params.id === 'string' ? params.id : ''
  const search = typeof params.search === 'string' ? params.search : ''
  const status = typeof params.status === 'string' ? params.status : ''
  const bonusType = typeof params.bonusType === 'string' ? params.bonusType : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'createdAt'
  const order = typeof params.order === 'string' ? params.order : 'desc'
  const validSortKeys = ['createdAt', 'amount']
  const sortField = validSortKeys.includes(sortBy) ? sortBy : 'createdAt'
  const sort = order === 'asc' ? sortField : `-${sortField}`

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {}
  if (id) {
    where.id = { equals: id }
  }
  if (search) {
    where['user.firstName'] = { like: search }
  }
  if (status && status !== 'all') {
    const valid = ['paid', 'pending', 'failed', 'cancelled']
    const values = status.split(',').filter((v) => valid.includes(v))
    if (values.length === 1) where.status = { equals: values[0] }
    else if (values.length > 1) where.status = { in: values }
  }
  if (bonusType && bonusType !== 'all') {
    where.bonusType = { equals: bonusType }
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
    collection: 'referral-bonuses' as any,
    where,
    page,
    limit,
    sort,
    depth: 2,
    overrideAccess: true,
  })

  const bonuses: ReferralBonusRow[] = (result.docs as any[]).map((r: any) => {
    const userObj = typeof r.user === 'object' && r.user ? r.user : null
    const txObj = typeof r.transaction === 'object' && r.transaction ? r.transaction : null

    return {
      id: r.id,
      user: userObj
        ? {
            id: userObj.id,
            firstName: userObj.firstName || '',
            lastName: userObj.lastName || '',
            email: userObj.email || '',
          }
        : null,
      transaction: txObj ? { id: txObj.id } : null,
      bonusType: r.bonusType || 'first_contribution',
      amount: r.amount || 0,
      status: r.status || 'pending',
      description: r.description || null,
      createdAt: r.createdAt,
    }
  })

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col flex-1 min-h-0">
        <CardHeader>
          <CardTitle>Referral Bonuses</CardTitle>
          <CardDescription>
            {result.totalDocs} bonus record{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ReferralBonusesDataTable
            bonuses={bonuses}
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
