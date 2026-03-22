'use client'

import { DataTable } from './data-table/data-table'
import { deletedAccountColumns, type DeletedAccountRow } from './data-table/columns/deleted-account-columns'
import { type PaginationProps } from './data-table/types'

export function DeletedAccountsDataTable({
  rows,
  pagination,
}: {
  rows: DeletedAccountRow[]
  pagination?: PaginationProps
}) {
  return (
    <DataTable
      tableId="deleted-accounts"
      columns={deletedAccountColumns}
      data={rows}
      pagination={pagination}
      emptyMessage="No deleted accounts found"
      scrollOffset="12rem"
    />
  )
}
