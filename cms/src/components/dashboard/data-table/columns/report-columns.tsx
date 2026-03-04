'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { type DataTableColumnMeta } from '../types'

export type ReportRow = {
  id: string
  jarName: string
  jarId: string
  message: string
  reporterName: string
  createdAt: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const reportColumns: ColumnDef<ReportRow, any>[] = [
  {
    accessorKey: 'jarName',
    header: 'Jar',
    cell: ({ row }) => (
      <span className="truncate block font-medium">{row.original.jarName}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search by jar name or message...' },
      filterLabel: 'Jar',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <span className="truncate block max-w-[300px]">{row.original.message}</span>
    ),
  },
  {
    accessorKey: 'reporterName',
    header: 'Reporter',
    cell: ({ row }) => row.original.reporterName,
  },
  {
    accessorKey: 'createdAt',
    header: 'Reported',
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
