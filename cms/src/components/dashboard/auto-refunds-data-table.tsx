'use client'

import { DataTable } from '@/components/dashboard/data-table/data-table'
import { autoRefundColumns, type AutoRefundRow } from '@/components/dashboard/data-table/columns/auto-refund-columns'

type Props = {
  data: AutoRefundRow[]
}

export function AutoRefundsDataTable({ data }: Props) {
  return (
    <DataTable
      columns={autoRefundColumns}
      data={data}
      readOnly
      emptyMessage="No auto refunds found."
      tableId="auto-refunds"
    />
  )
}
