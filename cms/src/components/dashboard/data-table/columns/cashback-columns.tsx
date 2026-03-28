'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'

export type CashbackRow = {
  id: string
  transaction: { id: string } | null
  user: { id: string; firstName: string; lastName: string; email: string } | null
  contributor: string | null
  jarName: string | null
  originalAmount: number
  discountPercent: number
  discountAmount: number
  hogapayRevenue: number
  createdAt: string
}

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const cashbackColumns: ColumnDef<CashbackRow, any>[] = [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const u = row.original.user
      if (!u) return <span className="text-muted-foreground">—</span>
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim()
      return (
        <Link href={`/dashboard/users/${u.id}`} className="hover:underline font-medium">
          {name || u.email}
        </Link>
      )
    },
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search user...' },
      filterLabel: 'User',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'contributor',
    header: 'Contributor',
    cell: ({ row }) => (
      <span>{row.original.contributor || '—'}</span>
    ),
  },
  {
    accessorKey: 'jarName',
    header: 'Jar',
    cell: ({ row }) => (
      <span>{row.original.jarName || '—'}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'jar', placeholder: 'Search jar...' },
      filterLabel: 'Jar',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'originalAmount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="font-medium">{formatAmount(row.original.originalAmount)}</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'discountPercent',
    header: 'Discount %',
    cell: ({ row }) => (
      <span className="text-blue-400 font-medium">{row.original.discountPercent}%</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'discountAmount',
    header: 'Discount Amt',
    cell: ({ row }) => (
      <span className="text-green-400 font-medium">{formatAmount(row.original.discountAmount)}</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'hogapayRevenue',
    header: 'Hogapay Rev',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatAmount(row.original.hogapayRevenue)}</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'transaction',
    header: 'Transaction',
    cell: ({ row }) => {
      const tx = row.original.transaction
      if (!tx) return <span className="text-muted-foreground">—</span>
      return (
        <span className="font-mono text-xs text-muted-foreground">{tx.id.slice(-8)}</span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: { type: 'dateRange', fromParamKey: 'from', toParamKey: 'to' },
      filterLabel: 'Date',
      sortKey: 'createdAt',
    } satisfies DataTableColumnMeta,
  },
]
