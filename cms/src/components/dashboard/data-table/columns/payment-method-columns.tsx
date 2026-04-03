'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { type DataTableColumnMeta } from '../types'

export type PaymentMethodRow = {
  id: string
  type: string
  country: string
  slug: string
  isActive: boolean
}

const COUNTRY_LABELS: Record<string, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
}

export const paymentMethodColumns: ColumnDef<PaymentMethodRow, any>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search type...' },
      filterLabel: 'Type',
    } satisfies DataTableColumnMeta,
  },
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
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'secondary'} className="text-xs">
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
]
