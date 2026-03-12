'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

function CopyableId({ id, prefix }: { id: string; prefix?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="group flex items-center gap-1">
      <span className="font-mono text-xs text-muted-foreground">
        {prefix && <span className="opacity-50">{prefix}</span>}{id}
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(prefix ? `${prefix}${id}` : id); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}

export type ReferralBonusRow = {
  id: string
  user: { id: string; firstName: string; lastName: string; email: string } | null
  transaction: { id: string } | null
  bonusType: 'first_contribution' | 'fee_share'
  amount: number
  status: 'paid' | 'pending' | 'failed' | 'cancelled'
  description: string | null
  createdAt: string
}

const bonusTypeLabels: Record<string, string> = {
  first_contribution: 'First Contribution',
  fee_share: 'Fee Share',
}

const bonusTypeStyles: Record<string, string> = {
  first_contribution: 'bg-purple-100 text-purple-800 border-purple-200',
  fee_share: 'bg-blue-100 text-blue-800 border-blue-200',
}

const statusStyles: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

function formatAmount(amount: number) {
  const abs = Math.abs(amount)
  const formatted = `GHS ${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return amount < 0 ? `-${formatted}` : formatted
}

export const referralBonusColumns: ColumnDef<ReferralBonusRow, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 220,
    cell: ({ row }) => <CopyableId id={row.original.id} prefix="referral-withdrawal-" />,
    meta: {
      filter: { type: 'search', paramKey: 'id', placeholder: 'Search by ID...' },
      filterLabel: 'ID',
    } satisfies DataTableColumnMeta,
  },
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
    accessorKey: 'transaction',
    header: 'Transaction',
    cell: ({ row }) => {
      const tx = row.original.transaction
      if (!tx) return <span className="text-muted-foreground">—</span>
      return (
        <Link href={`/dashboard/transactions?highlight=${tx.id}`} className="font-mono text-xs hover:underline">
          {tx.id}
        </Link>
      )
    },
  },
  {
    accessorKey: 'bonusType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('text-xs', bonusTypeStyles[row.original.bonusType])}>
        {bonusTypeLabels[row.original.bonusType] || row.original.bonusType}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'bonusType',
        options: [
          { label: 'All', value: 'all' },
          { label: 'First Contribution', value: 'first_contribution' },
          { label: 'Fee Share', value: 'fee_share' },
        ],
      },
      filterLabel: 'Type',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className={cn('font-medium', row.original.amount < 0 ? 'text-red-400' : 'text-green-400')}>
        {formatAmount(row.original.amount)}
      </span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      sortKey: 'amount',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', statusStyles[row.original.status])}>
        {row.original.status}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
          { label: 'Failed', value: 'failed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs truncate block max-w-xs">
        {row.original.description || '—'}
      </span>
    ),
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
