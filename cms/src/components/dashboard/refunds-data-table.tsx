'use client'

import { useState } from 'react'
import { DataTable } from './data-table/data-table'
import { refundColumns, type RefundRow } from './data-table/columns/refund-columns'
import { RefundDetailSheet } from './refund-detail-sheet'
import { type PaginationProps } from './data-table/types'

export function RefundsDataTable({
  refunds,
  pagination,
}: {
  refunds: RefundRow[]
  pagination?: PaginationProps
}) {
  const [selected, setSelected] = useState<RefundRow | null>(null)

  return (
    <>
      <DataTable
        columns={refundColumns}
        data={refunds}
        pagination={pagination}
        scrollOffset="20rem"
        onRowClick={setSelected}
      />
      <RefundDetailSheet selected={selected} onClose={() => setSelected(null)} />
    </>
  )
}
