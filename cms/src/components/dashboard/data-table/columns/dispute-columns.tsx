'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { type DataTableColumnMeta } from '../types'

export type DisputeRow = {
  id: string
  transactionId: string | null
  raisedById: string | null
  raisedByName: string
  resolvedById: string | null
  resolvedByName: string | null
  description: string
  status: 'open' | 'under-review' | 'resolved' | 'rejected'
  createdAt: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const statusStyles: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-300 border-blue-700',
  'under-review': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  resolved: 'bg-green-900/40 text-green-300 border-green-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
}

export const disputeColumns: ColumnDef<DisputeRow, any>[] = [
  {
    accessorKey: 'raisedByName',
    header: 'Raised By',
    cell: ({ row }) =>
      row.original.raisedById ? (
        <Link
          href={`/dashboard/users/${row.original.raisedById}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.raisedByName}
        </Link>
      ) : (
        <span className="font-medium">{row.original.raisedByName}</span>
      ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search by name...' },
      filterLabel: 'User',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', statusStyles[row.original.status])}>
        {statusLabel[row.original.status] ?? row.original.status}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Under Review', value: 'under-review' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'resolvedByName',
    header: 'Resolved By',
    cell: ({ row }) => {
      const { resolvedById, resolvedByName } = row.original
      if (!resolvedByName) return <span className="text-muted-foreground">—</span>
      return resolvedById ? (
        <Link
          href={`/dashboard/users/${resolvedById}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {resolvedByName}
        </Link>
      ) : (
        <span className="font-medium">{resolvedByName}</span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: {
        type: 'dateRange',
        fromParamKey: 'from',
        toParamKey: 'to',
      },
      filterLabel: 'Date',
    } satisfies DataTableColumnMeta,
  },
]
