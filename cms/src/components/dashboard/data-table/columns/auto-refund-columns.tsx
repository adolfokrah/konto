'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { RefundStatusBadge } from '@/components/dashboard/refund-status-badge'
import { AutoRefundActions } from '@/components/dashboard/auto-refund-actions'
import { type DataTableColumnMeta } from '../types'

export type AutoRefundRow = {
  jarId: string
  jarName: string
  currency: string
  totalAmount: number
  contributors: number
  triggeredAt: string | null
  status: 'awaiting_approval' | 'in-progress' | 'pending' | 'completed' | 'failed' | 'rejected'
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
    size: 200,
    cell: ({ row }) => (
      <Link href={`/dashboard/jars/${row.original.jarId}`} className="font-medium hover:underline">
        {row.original.jarName}
      </Link>
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
    header: 'Contributors',
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
    size: 180,
    enableResizing: false,
    cell: ({ row }) =>
      row.original.status === 'awaiting_approval' ? (
        <AutoRefundActions jarId={row.original.jarId} />
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    meta: {} satisfies DataTableColumnMeta,
  },
]
