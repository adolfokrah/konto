'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { type DataTableColumnMeta } from '../types'

export type CollectionFeeRow = {
  id: string
  country: string
  paymentMethod: { id: string; type: string; slug: string } | null
  fee: number
  hogapaySplit: number
  minimumContributionAmount: number
}

const COUNTRY_LABELS: Record<string, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
}

export const collectionFeeColumns: ColumnDef<CollectionFeeRow, any>[] = [
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => (
      <span>{COUNTRY_LABELS[row.original.country] ?? row.original.country}</span>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'country',
        options: [
          { label: 'Ghana', value: 'ghana' },
          { label: 'Nigeria', value: 'nigeria' },
        ],
      },
      filterLabel: 'Country',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Payment Method',
    cell: ({ row }) => {
      const pm = row.original.paymentMethod
      return pm ? (
        <span className="font-medium capitalize">{pm.type}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'fee',
    header: 'Fee (%)',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.fee}%</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'hogapaySplit',
    header: 'Hogapay Split (%)',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.hogapaySplit}%</span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'minimumContributionAmount',
    header: 'Min Contribution',
    cell: ({ row }) => <span>{row.original.minimumContributionAmount}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const { onEdit, onDelete } = (table.options.meta as any) ?? {}
      return (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit?.(row.original)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(row.original)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )
    },
    meta: { headerClassName: 'text-right', cellClassName: 'text-right' } satisfies DataTableColumnMeta,
  },
]
