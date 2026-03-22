import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeletedAccountsDataTable } from '@/components/dashboard/deleted-accounts-data-table'
import { type DeletedAccountRow } from '@/components/dashboard/data-table/columns/deleted-account-columns'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DeletedAccountsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT
  const search = typeof params.search === 'string' ? params.search : ''
  const reason = typeof params.reason === 'string' ? params.reason : ''
  const from = typeof params.from === 'string' ? params.from : ''
  const to = typeof params.to === 'string' ? params.to : ''
  const sort = typeof params.sort === 'string' ? params.sort : '-createdAt'

  const payload = await getPayload({ config: configPromise })

  const where: Record<string, any> = {}
  if (search) {
    where.or = [
      { email: { like: search } },
      { phoneNumber: { like: search } },
      { deletionReason: { like: search } },
    ]
  }
  if (reason && reason !== 'all') {
    where.deletionReason = { equals: reason }
  }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.greater_than_equal = new Date(from).toISOString()
    if (to) where.createdAt.less_than_equal = new Date(to).toISOString()
  }

  const result = await payload.find({
    collection: 'deletedUserAccounts',
    where,
    page,
    limit,
    sort,
    overrideAccess: true,
  })

  const rows: DeletedAccountRow[] = result.docs.map((d: any) => ({
    id: d.id,
    email: d.email,
    phoneNumber: d.phoneNumber ?? null,
    deletionReason: d.deletionReason ?? null,
    createdAt: d.createdAt,
  }))

  return (
    <Card className="flex flex-col h-[calc(100vh-3.5rem-2rem)] lg:h-[calc(100vh-3.5rem-3rem)]">
      <CardHeader>
        <CardTitle>Deleted Accounts</CardTitle>
        <CardDescription>
          {result.totalDocs} account{result.totalDocs !== 1 ? 's' : ''} deleted
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <DeletedAccountsDataTable
          rows={rows}
          pagination={{
            currentPage: page,
            totalPages: result.totalPages,
            totalRows: result.totalDocs,
            rowsPerPage: limit,
          }}
        />
      </CardContent>
    </Card>
  )
}
