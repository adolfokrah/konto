import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Flag } from 'lucide-react'
import { MetricCard } from '@/components/dashboard/metric-card'
import { ReportsDataTable } from '@/components/dashboard/reports-data-table'
import { TableCard } from '@/components/dashboard/table-card'
import { PageHeader } from '@/components/dashboard/page-header'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function JarReportsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''

  const payload = await getPayload({ config: configPromise })

  // Build where clause
  const where: Record<string, any> = {}
  if (search) {
    where.or = [{ message: { like: search } }, { 'jar.name': { like: search } }]
  }
  if (from) {
    where.createdAt = { ...where.createdAt, greater_than_equal: new Date(from).toISOString() }
  }
  if (to) {
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...where.createdAt, less_than_equal: toDate.toISOString() }
  }

  const [totalReports, reportsResult] = await Promise.all([
    payload.count({ collection: 'jar-reports', overrideAccess: true }),
    payload.find({
      collection: 'jar-reports',
      where,
      page,
      limit,
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const reports = reportsResult.docs.map((report: any) => {
    const jarObj = typeof report.jar === 'object' && report.jar ? report.jar : null
    const userObj = typeof report.user === 'object' && report.user ? report.user : null

    return {
      id: report.id,
      jarName: jarObj?.name || 'Unknown Jar',
      jarId: jarObj?.id || (typeof report.jar === 'string' ? report.jar : ''),
      message: report.message,
      reporterId: userObj?.id || null,
      reporterName: userObj
        ? `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() ||
          userObj.email ||
          'Unknown'
        : 'Anonymous',
      createdAt: report.createdAt,
    }
  })

  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Jar reports" subtitle="Jars reported by contributors" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="Total Reports"
          value={totalReports.totalDocs.toLocaleString()}
          icon={Flag}
        />
      </div>

      <TableCard
        title="All jar reports"
        description={
          <>
            {reportsResult.totalDocs} report{reportsResult.totalDocs !== 1 ? 's' : ''} found
          </>
        }
        className="flex-1 min-h-0"
      >
        <ReportsDataTable
          reports={reports}
          fillParent
          pagination={{
            currentPage: page,
            totalPages: reportsResult.totalPages,
            totalRows: reportsResult.totalDocs,
            rowsPerPage: limit,
          }}
        />
      </TableCard>
    </div>
  )
}
