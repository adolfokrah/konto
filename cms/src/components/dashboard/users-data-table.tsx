'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from './data-table/data-table'
import { userColumns, type UserRow } from './data-table/columns/user-columns'
import { type PaginationProps } from './data-table/types'

export function UsersDataTable({
  users,
  pagination,
  fillParent,
}: {
  users: UserRow[]
  pagination?: PaginationProps
  fillParent?: boolean
}) {
  const router = useRouter()

  return (
    <DataTable
      tableId="users"
      columns={userColumns}
      data={users}
      pagination={pagination}
      fillParent={fillParent}
      onRowClick={(user) => router.push(`/dashboard/users/${user.id}`)}
    />
  )
}
