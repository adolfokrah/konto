import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReferralsDataTable } from '@/components/dashboard/referrals-data-table'
import { type ReferralRow } from '@/components/dashboard/data-table/columns/referral-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ReferralsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'createdAt'
  const order = typeof params.order === 'string' ? params.order : 'desc'
  const sort = order === 'asc' ? 'createdAt' : '-createdAt'

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {}
  if (search) {
    where['referredBy.firstName'] = { like: search }
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
    collection: 'referrals' as any,
    where,
    page,
    limit,
    sort,
    depth: 2,
    overrideAccess: true,
  })

  const referrals: ReferralRow[] = (result.docs as any[]).map((r: any) => {
    const referredByObj = typeof r.referredBy === 'object' && r.referredBy ? r.referredBy : null
    const referralObj = typeof r.referral === 'object' && r.referral ? r.referral : null

    return {
      id: r.id,
      referredBy: referredByObj
        ? {
            id: referredByObj.id,
            firstName: referredByObj.firstName || '',
            lastName: referredByObj.lastName || '',
            email: referredByObj.email || '',
          }
        : null,
      referral: referralObj
        ? {
            id: referralObj.id,
            firstName: referralObj.firstName || '',
            lastName: referralObj.lastName || '',
            email: referralObj.email || '',
          }
        : null,
      referralCode: r.referralCode || '',
      createdAt: r.createdAt,
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>
            {result.totalDocs} referral{result.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReferralsDataTable
            referrals={referrals}
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
