'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { type DataTableColumnMeta } from '../types'

export type JarRow = {
  id: string
  name: string
  creatorName: string
  creatorEmail: string
  status: 'open' | 'frozen' | 'broken' | 'sealed'
  goalAmount: number
  totalContributions: number
  balance: number
  upcomingBalance: number
  contributorsCount: number
  currency: string
  createdAt: string
  description: string | null
  deadline: string | null
  isActive: boolean
  isFixedContribution: boolean
  acceptedContributionAmount: number | null
  allowAnonymousContributions: boolean
  thankYouMessage: string | null
  imageUrl: string | null
  freezeReason: string | null
}

const statusStyles: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  sealed: 'bg-blue-100 text-blue-800 border-blue-200',
  broken: 'bg-red-100 text-red-800 border-red-200',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const jarColumns: ColumnDef<JarRow, any>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="truncate block font-medium">{row.original.name}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search jars...' },
      filterLabel: 'Name',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'creatorName',
    header: 'Creator',
    cell: ({ row }) => row.original.creatorName,
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
          { label: 'Open', value: 'open' },
          { label: 'Frozen', value: 'frozen' },
          { label: 'Sealed', value: 'sealed' },
          { label: 'Broken', value: 'broken' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'goalAmount',
    header: 'Goal',
    cell: ({ row }) =>
      row.original.goalAmount > 0
        ? formatAmount(row.original.goalAmount, row.original.currency)
        : '\u2014',
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'totalContributions',
    header: 'Contributions',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatAmount(row.original.totalContributions, row.original.currency)}
      </span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => (
      <span className="font-medium">
        {formatAmount(row.original.balance, row.original.currency)}
      </span>
    ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'upcomingBalance',
    header: 'Upcoming',
    cell: ({ row }) =>
      row.original.upcomingBalance > 0 ? (
        <span className="text-amber-600 font-medium">
          {formatAmount(row.original.upcomingBalance, row.original.currency)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'contributorsCount',
    header: 'Collectors',
    cell: ({ row }) => row.original.contributorsCount,
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: {
        type: 'dateRange',
        fromParamKey: 'from',
        toParamKey: 'to',
      },
      filterLabel: 'Created',
    } satisfies DataTableColumnMeta,
  },
]
