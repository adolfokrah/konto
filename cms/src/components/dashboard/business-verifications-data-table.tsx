'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from './data-table/data-table'
import {
  businessVerificationColumns,
  type BusinessVerificationRow,
} from './data-table/columns/business-verification-columns'
import { type PaginationProps } from './data-table/types'

export function BusinessVerificationsDataTable({
  rows,
  pagination,
  fillParent,
}: {
  rows: BusinessVerificationRow[]
  pagination?: PaginationProps
  fillParent?: boolean
}) {
  const router = useRouter()

  return (
    <DataTable
      tableId="business-verifications"
      columns={businessVerificationColumns}
      data={rows}
      pagination={pagination}
      fillParent={fillParent}
      onRowClick={(row) => {
        if (row.userId) router.push(`/dashboard/users/${row.userId}?tab=kyb`)
      }}
    />
  )
}
