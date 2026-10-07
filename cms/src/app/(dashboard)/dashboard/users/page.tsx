import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { MetricCard } from '@/components/dashboard/metric-card'
import { UsersDataTable } from '@/components/dashboard/users-data-table'
import { ExportUsersButton } from '@/components/dashboard/export-users-button'
import { type UserRow } from '@/components/dashboard/data-table/columns/user-columns'
import { TableCard } from '@/components/dashboard/table-card'
import { PageHeader } from '@/components/dashboard/page-header'
import { userSearchClauses } from '@/utilities/dashboardSearch'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const email = typeof params.email === 'string' ? params.email : ''
  const kyc = typeof params.kyc === 'string' ? params.kyc : ''
  const role = typeof params.role === 'string' ? params.role : ''
  const platform = typeof params.platform === 'string' ? params.platform : ''
  const accountType = typeof params.accountType === 'string' ? params.accountType : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause from filters
  const where: Record<string, any> = {}
  if (search) {
    where.and = userSearchClauses(search)
  }
  if (kyc && ['none', 'in_review', 'verified'].includes(kyc)) {
    where.kycStatus = { equals: kyc }
  }
  if (role && ['user', 'admin'].includes(role)) {
    where.role = { equals: role }
  }
  if (accountType === 'organization') {
    where.accountType = { equals: 'organization' }
  } else if (accountType === 'individual') {
    // Users created before account types existed count as individuals.
    where.accountType = { not_equals: 'organization' }
  }
  if (platform && ['android', 'ios'].includes(platform)) {
    where.platform = { equals: platform }
  }
  if (email) {
    where.email = { like: email }
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Run all queries in parallel
  const [totalCount, kycNoneCount, kycInReviewCount, kycVerifiedCount, dauCount, usersResult] =
    await Promise.all([
      payload.count({ collection: 'users', overrideAccess: true }),
      payload.count({
        collection: 'users',
        overrideAccess: true,
        where: { kycStatus: { equals: 'none' } },
      }),
      payload.count({
        collection: 'users',
        overrideAccess: true,
        where: { kycStatus: { equals: 'in_review' } },
      }),
      payload.count({
        collection: 'users',
        overrideAccess: true,
        where: { kycStatus: { equals: 'verified' } },
      }),
      payload.count({
        collection: 'dailyActiveUsers',
        overrideAccess: true,
        where: { createdAt: { greater_than_equal: startOfToday.toISOString() } },
      }),
      payload.find({
        collection: 'users',
        where,
        page,
        limit,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      }),
    ])

  // Map to UserRow type
  const users: UserRow[] = usersResult.docs.map((u: any) => {
    const photoObj = typeof u.photo === 'object' && u.photo ? u.photo : null
    return {
      id: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      countryCode: u.countryCode || null,
      country: u.country || '',
      photoUrl: photoObj?.url || null,
      accountType: u.accountType === 'organization' ? 'organization' : 'individual',
      kycStatus: u.kycStatus || 'none',
      kycSessionId: u.kycSessionId || null,
      role: u.role || 'user',
      demoUser: u.demoUser ?? false,
      platform: u.platform || null,
      createdAt: u.createdAt,
    }
  })

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Users" subtitle="People on Hogapay" />
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Total users" value={totalCount.totalDocs.toLocaleString()} />
        <MetricCard title="Not verified" value={kycNoneCount.totalDocs.toLocaleString()} />
        <MetricCard title="In review" value={kycInReviewCount.totalDocs.toLocaleString()} />
        <MetricCard title="Verified" value={kycVerifiedCount.totalDocs.toLocaleString()} />
        <MetricCard title="Daily active" value={dauCount.totalDocs.toLocaleString()} />
      </div>

      {/* Users Table */}
      <TableCard
        title="All users"
        description={
          <>
            {usersResult.totalDocs} user{usersResult.totalDocs !== 1 ? 's' : ''} found
          </>
        }
        actions={<ExportUsersButton />}
        className="flex-1 min-h-0"
      >
        <UsersDataTable
          users={users}
          fillParent
          pagination={{
            currentPage: page,
            totalPages: usersResult.totalPages,
            totalRows: usersResult.totalDocs,
            rowsPerPage: limit,
          }}
        />
      </TableCard>
    </div>
  )
}
