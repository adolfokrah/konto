'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { type DataTableColumnMeta } from '../types'

export type PayoutFeeRow = {
  id: string
  country: string
  paymentMethod: { id: string; type: string } | null
  fee: number
  hogapaySplit: number
  flatFeeThreshold: number
  flatFee: number
  minimumPayoutAmount: number
}

const COUNTRY_LABELS: Record<string, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
}

export const payoutFeeColumns: ColumnDef<PayoutFeeRow, any>[] = [
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
    cell: ({ row }) => <span className="font-medium">{row.original.fee}%</span>,
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
    accessorKey: 'flatFeeThreshold',
    header: 'Flat Fee Threshold',
    cell: ({ row }) => <span>{row.original.flatFeeThreshold}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'flatFee',
    header: 'Flat Fee',
    cell: ({ row }) => <span>{row.original.flatFee}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'minimumPayoutAmount',
    header: 'Min Payout',
    cell: ({ row }) => <span>{row.original.minimumPayoutAmount}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
]
