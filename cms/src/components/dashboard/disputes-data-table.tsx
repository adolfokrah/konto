'use client'

import { useState } from 'react'
import { DataTable } from './data-table/data-table'
import { disputeColumns, type DisputeRow } from './data-table/columns/dispute-columns'
import { type PaginationProps } from './data-table/types'
import { DisputeDetailSheet } from './dispute-detail-sheet'

export function DisputesDataTable({
  disputes,
  pagination,
  fillParent,
}: {
  disputes: DisputeRow[]
  pagination?: PaginationProps
  fillParent?: boolean
}) {
  const [selected, setSelected] = useState<DisputeRow | null>(null)

  return (
    <>
      <DataTable
        tableId="disputes"
        columns={disputeColumns}
        data={disputes}
        pagination={pagination}
        fillParent={fillParent}
        onRowClick={setSelected}
      />
      <DisputeDetailSheet selected={selected} onClose={() => setSelected(null)} />
    </>
  )
}
