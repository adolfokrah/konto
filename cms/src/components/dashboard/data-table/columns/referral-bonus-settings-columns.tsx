'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { type DataTableColumnMeta } from '../types'

export type ReferralBonusSettingRow = {
  id: string
  country: string
  firstContributionBonus: number
  feeShare: number
  minWithdrawal: number
}

const COUNTRY_LABELS: Record<string, string> = {
  ghana: 'Ghana',
  nigeria: 'Nigeria',
}

export const referralBonusSettingsColumns: ColumnDef<ReferralBonusSettingRow, any>[] = [
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
    accessorKey: 'firstContributionBonus',
    header: 'First Contribution Bonus',
    cell: ({ row }) => <span className="font-medium">{row.original.firstContributionBonus}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'feeShare',
    header: 'Fee Share (%)',
    cell: ({ row }) => <span>{row.original.feeShare}%</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'minWithdrawal',
    header: 'Min Withdrawal',
    cell: ({ row }) => <span>{row.original.minWithdrawal}</span>,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
]
