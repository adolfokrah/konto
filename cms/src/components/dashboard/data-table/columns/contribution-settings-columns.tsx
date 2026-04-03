'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { type DataTableColumnMeta } from '../types'

export type SettlementDelayRow = {
  id: string
  country: string
  hours: number
}

const COUNTRY_LABELS: Record<string, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
}

export const settlementDelayColumns: ColumnDef<SettlementDelayRow, any>[] = [
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
    accessorKey: 'hours',
    header: 'Delay (hrs)',
    cell: ({ row }) => {
      const h = row.original.hours
      const label = h < 1 ? `${Math.round(h * 60)} min` : `${h}h`
      return <span className="text-muted-foreground">{label}</span>
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
]
