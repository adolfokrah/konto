'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'

export type DeletedAccountRow = {
  id: string
  email: string
  phoneNumber: string | null
  deletionReason: string | null
  createdAt: string
}

export const deletedAccountColumns: ColumnDef<DeletedAccountRow, any>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <span className="font-medium">{row.original.email}</span>,
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search email, phone or reason…' },
      filterLabel: 'Search',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.phoneNumber || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'deletionReason',
    header: 'Reason',
    cell: ({ row }) =>
      row.original.deletionReason ? (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {row.original.deletionReason}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'reason',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Technical issues', value: 'Technical issues' },
          { label: 'Privacy concerns', value: 'Privacy concerns' },
          { label: 'Not using anymore', value: 'Not using anymore' },
          { label: 'Other', value: 'Other' },
        ],
      },
      filterLabel: 'Reason',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'createdAt',
    header: 'Deleted At',
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{formatShortDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: { type: 'dateRange', fromParamKey: 'from', toParamKey: 'to' },
      filterLabel: 'Date',
      sortKey: 'createdAt',
    } satisfies DataTableColumnMeta,
  },
]
