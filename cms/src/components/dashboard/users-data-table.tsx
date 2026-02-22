'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from './data-table/data-table'
import { userColumns, type UserRow } from './data-table/columns/user-columns'
import { type PaginationProps } from './data-table/types'

export function UsersDataTable({
  users,
  pagination,
}: {
  users: UserRow[]
  pagination?: PaginationProps
}) {
  const router = useRouter()

  return (
    <DataTable
      columns={userColumns}
      data={users}
      pagination={pagination}
      onRowClick={(user) => router.push(`/dashboard/users/${user.id}`)}
    />
  )
}
