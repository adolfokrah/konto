'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

function CopyableId({ id, prefix }: { id: string; prefix?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="group flex items-center gap-1">
      <span className="font-mono text-xs text-muted-foreground">
        {prefix && <span className="opacity-50">{prefix}</span>}{id}
      </span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(prefix ? `${prefix}${id}` : id); setCopied(true); toast.success('Copied to clipboard'); setTimeout(() => setCopied(false), 1500) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}

export type RefundRow = {
  id: string
  initiatedBy: { id: string; firstName: string; lastName: string; email: string } | null
  amount: number
  accountNumber: string
  accountName: string
  mobileMoneyProvider: string
  jar: { id: string; name: string; currency: string } | null
  linkedTransaction: { id: string; contributor: string } | null
  eganowFees: number
  hogapayRevenue: number
  transactionReference: string | null
  status: 'pending' | 'in-progress' | 'failed' | 'completed'
  createdAt: string
}

const refundStatusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

const refundStatusLabels: Record<string, string> = {
  pending: 'Awaiting Approval',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
}

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const refundColumns: ColumnDef<RefundRow, any>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 220,
    cell: ({ row }) => <CopyableId id={row.original.id} prefix="refund-" />,
    meta: {
      filter: { type: 'search', paramKey: 'id', placeholder: 'Search by ID...' },
      filterLabel: 'ID',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'accountName',
    header: 'Contributor',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.accountName || '\u2014'}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search...' },
      filterLabel: 'Contributor',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'accountNumber',
    header: 'Account',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.accountNumber || '\u2014'}</span>
    ),
  },
  {
    accessorKey: 'jar',
    header: 'Jar',
    size: 150,
    cell: ({ row }) =>
      row.original.jar ? (
        <Link href={`/dashboard/jars/${row.original.jar.id}`} className="truncate block hover:underline">
          {row.original.jar.name}
        </Link>
      ) : (
        <span>{'\u2014'}</span>
      ),
    meta: {
      filter: { type: 'search', paramKey: 'jar', placeholder: 'Search jar...' },
      filterLabel: 'Jar',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const currency = row.original.jar?.currency || 'GHS'
      return (
        <span className="font-medium text-red-400">
          {formatAmount(Math.abs(row.original.amount), currency)}
        </span>
      )
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      sortKey: 'amount',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'eganowFees',
    header: 'Eganow Fees',
    cell: ({ row }) => {
      if (!row.original.eganowFees) return <span className="text-muted-foreground">{'\u2014'}</span>
      return <span className="text-muted-foreground">{formatAmount(Math.abs(row.original.eganowFees))}</span>
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'hogapayRevenue',
    header: 'Hogapay Rev',
    cell: ({ row }) => {
      if (!row.original.hogapayRevenue) return <span className="text-muted-foreground">{'\u2014'}</span>
      return <span className="text-green-400">{formatAmount(Math.abs(row.original.hogapayRevenue))}</span>
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', refundStatusStyles[row.original.status])}>
        {refundStatusLabels[row.original.status] || row.original.status}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Awaiting Approval', value: 'pending' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'initiatedBy',
    header: 'Initiated By',
    cell: ({ row }) => {
      const user = row.original.initiatedBy
      if (!user) return <span className="text-muted-foreground">{'\u2014'}</span>
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      return <span>{name || user.email || '\u2014'}</span>
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: {
        type: 'dateRange',
        fromParamKey: 'from',
        toParamKey: 'to',
      },
      filterLabel: 'Date',
      sortKey: 'createdAt',
    } satisfies DataTableColumnMeta,
  },
]
