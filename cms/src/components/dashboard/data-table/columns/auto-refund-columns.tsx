'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { RefundStatusBadge } from '@/components/dashboard/refund-status-badge'
import { AutoRefundActions } from '@/components/dashboard/auto-refund-actions'
import { type DataTableColumnMeta } from '../types'

export type AutoRefundItem = {
  id: string
  accountName: string
  accountNumber: string
  mobileMoneyProvider: string
  amount: number
  status: string
  transactionReference: string | null
}

export type AutoRefundRow = {
  jarId: string
  jarName: string
  currency: string
  totalAmount: number
  contributors: number
  triggeredAt: string | null
  status: 'awaiting_approval' | 'in-progress' | 'pending' | 'completed' | 'failed' | 'rejected'
  items: AutoRefundItem[]
}

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const autoRefundColumns: ColumnDef<AutoRefundRow, any>[] = [
  {
    accessorKey: 'jarName',
    header: 'Jar',
    size: 220,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-expanded:rotate-90" />
        <Link
          href={`/dashboard/jars/${row.original.jarId}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.jarName}
        </Link>
      </div>
    ),
    meta: {} satisfies DataTableColumnMeta,
  },
  {
    id: 'totalAmount',
    header: 'Total Amount',
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatAmount(row.original.totalAmount, row.original.currency)}
      </span>
    ),
    meta: {} satisfies DataTableColumnMeta,
  },
  {
    id: 'contributors',
    header: 'Transactions',
    cell: ({ row }) => <span className="tabular-nums">{row.original.contributors}</span>,
    meta: {} satisfies DataTableColumnMeta,
  },
  {
    id: 'triggeredAt',
    header: 'Triggered',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.triggeredAt)}</span>
    ),
    meta: {} satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <RefundStatusBadge status={row.original.status} />,
    meta: {} satisfies DataTableColumnMeta,
  },
  {
    id: 'actions',
    header: '',
    size: 200,
    enableResizing: false,
    cell: ({ row }) =>
      row.original.status === 'awaiting_approval' ? (
        <div onClick={(e) => e.stopPropagation()}>
          <AutoRefundActions jarId={row.original.jarId} />
        </div>
      ) : null,
    meta: {} satisfies DataTableColumnMeta,
  },
]
