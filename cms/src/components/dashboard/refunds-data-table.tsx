'use client'

import { useState } from 'react'
import { DataTable } from './data-table/data-table'
import { refundColumns, type RefundRow } from './data-table/columns/refund-columns'
import { RefundDetailSheet } from './refund-detail-sheet'
import { type PaginationProps } from './data-table/types'

export function RefundsDataTable({
  currentUserId,
  refunds,
  pagination,
}: {
  currentUserId: string
  refunds: RefundRow[]
  pagination?: PaginationProps
}) {
  const [selected, setSelected] = useState<RefundRow | null>(null)

  return (
    <>
      <DataTable
        tableId="refunds"
        columns={refundColumns}
        data={refunds}
        pagination={pagination}
        scrollOffset="20rem"
        onRowClick={setSelected}
      />
      <RefundDetailSheet selected={selected} currentUserId={currentUserId} onClose={() => setSelected(null)} />
    </>
  )
}
