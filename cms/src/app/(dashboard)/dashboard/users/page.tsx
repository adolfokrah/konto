import { getPayload } from 'payload'
import configPromise from '@payload-config'
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ShieldX,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { UsersDataTable } from '@/components/dashboard/users-data-table'
import { type UserRow } from '@/components/dashboard/data-table/columns/user-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const kyc = typeof params.kyc === 'string' ? params.kyc : ''
  const role = typeof params.role === 'string' ? params.role : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause from filters
  const where: Record<string, any> = {}
  if (search) {
    where.or = [
      { firstName: { like: search } },
      { lastName: { like: search } },
      { phoneNumber: { like: search } },
    ]
  }
  if (kyc && ['none', 'in_review', 'verified'].includes(kyc)) {
    where.kycStatus = { equals: kyc }
  }
  if (role && ['user', 'admin'].includes(role)) {
    where.role = { equals: role }
  }

  // Run all queries in parallel
  const [
    totalCount,
    kycNoneCount,
    kycInReviewCount,
    kycVerifiedCount,
    adminCount,
    usersResult,
  ] = await Promise.all([
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
      collection: 'users',
      overrideAccess: true,
      where: { role: { equals: 'admin' } },
    }),
    payload.find({
      collection: 'users',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    }),
  ])

  // Map to UserRow type
  const users: UserRow[] = usersResult.docs.map((u: any) => ({
    id: u.id,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    email: u.email || '',
    phoneNumber: u.phoneNumber || '',
    countryCode: u.countryCode || null,
    country: u.country || '',
    kycStatus: u.kycStatus || 'none',
    kycSessionId: u.kycSessionId || null,
    role: u.role || 'user',
    demoUser: u.demoUser ?? false,
    bank: u.bank || null,
    accountNumber: u.accountNumber || null,
    accountHolder: u.accountHolder || null,
    createdAt: u.createdAt,
  }))

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Users"
          value={totalCount.totalDocs.toLocaleString()}
          icon={Users}
        />
        <MetricCard
          title="Not Verified"
          value={kycNoneCount.totalDocs.toLocaleString()}
          description="KYC not started"
          icon={ShieldX}
        />
        <MetricCard
          title="In Review"
          value={kycInReviewCount.totalDocs.toLocaleString()}
          description="KYC pending review"
          icon={Clock}
        />
        <MetricCard
          title="Verified"
          value={kycVerifiedCount.totalDocs.toLocaleString()}
          description="KYC approved"
          icon={ShieldCheck}
        />
        <MetricCard
          title="Admins"
          value={adminCount.totalDocs.toLocaleString()}
          icon={ShieldAlert}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {usersResult.totalDocs} user{usersResult.totalDocs !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersDataTable
            users={users}
            pagination={{
              currentPage: page,
              totalPages: usersResult.totalPages,
              totalRows: usersResult.totalDocs,
              rowsPerPage: limit,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
