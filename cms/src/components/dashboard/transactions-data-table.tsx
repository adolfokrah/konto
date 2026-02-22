'use client'

import { useState } from 'react'
import { DataTable } from './data-table/data-table'
import { transactionColumns, type TransactionRow } from './data-table/columns/transaction-columns'
import { TransactionDetailSheet } from './transaction-detail-sheet'
import { type PaginationProps } from './data-table/types'

export function TransactionsDataTable({
  transactions,
  pagination,
}: {
  transactions: TransactionRow[]
  pagination?: PaginationProps
}) {
  const [selected, setSelected] = useState<TransactionRow | null>(null)

  return (
    <>
      <DataTable
        columns={transactionColumns}
        data={transactions}
        pagination={pagination}
        onRowClick={setSelected}
      />
      <TransactionDetailSheet selected={selected} onClose={() => setSelected(null)} />
    </>
  )
}
