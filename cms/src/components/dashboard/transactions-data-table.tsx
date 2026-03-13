'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from './data-table/data-table'
import { transactionColumns, type TransactionRow } from './data-table/columns/transaction-columns'
import { type PaginationProps } from './data-table/types'

export function TransactionsDataTable({
  transactions,
  pagination,
}: {
  transactions: TransactionRow[]
  pagination?: PaginationProps
}) {
  const router = useRouter()

  return (
    <DataTable
      tableId="transactions"
      columns={transactionColumns}
      data={transactions}
      pagination={pagination}
      scrollOffset="20rem"
      onRowClick={(row) => router.push(`/dashboard/transactions/${row.id}`)}
    />
  )
}
