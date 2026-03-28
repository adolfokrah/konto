'use client'

import { DataTable } from './data-table/data-table'
import { cashbackColumns, type CashbackRow } from './data-table/columns/cashback-columns'
import { type PaginationProps } from './data-table/types'

export function CashbacksDataTable({
  cashbacks,
  pagination,
}: {
  cashbacks: CashbackRow[]
  pagination?: PaginationProps
}) {
  return (
    <DataTable
      tableId="cashbacks"
      columns={cashbackColumns}
      data={cashbacks}
      pagination={pagination}
      scrollOffset="20rem"
    />
  )
}
