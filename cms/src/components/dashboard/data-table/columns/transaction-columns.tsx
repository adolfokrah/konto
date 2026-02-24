'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import {
  typeStyles,
  statusStyles,
  statusLabels,
  paymentMethodLabels,
  formatShortDate,
} from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'

export type TransactionRow = {
  id: string
  contributor: string | null
  contributorPhoneNumber: string | null
  jar: { id: string; name: string } | null
  paymentMethod: string | null
  mobileMoneyProvider: string | null
  accountNumber: string | null
  amountContributed: number
  chargesBreakdown: {
    platformCharge: number | null
    amountPaidByContributor: number | null
    eganowFees: number | null
    hogapayRevenue: number | null
  } | null
  paymentStatus: 'pending' | 'completed' | 'failed'
  type: 'contribution' | 'payout'
  isSettled: boolean
  payoutFeePercentage: number | null
  payoutFeeAmount: number | null
  payoutNetAmount: number | null
  transactionReference: string | null
  collector: { id: string; firstName: string; lastName: string; email: string } | null
  viaPaymentLink: boolean
  createdAt: string
}

function formatAmount(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const transactionColumns: ColumnDef<TransactionRow, any>[] = [
  {
    accessorKey: 'transactionReference',
    header: 'Transaction',
    cell: ({ row }) => (
      <span className="font-medium text-xs font-mono">
        {row.original.transactionReference || '\u2014'}
      </span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'ref', placeholder: 'Search ref...' },
      filterLabel: 'Transaction',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'contributor',
    header: 'Contributor',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.contributor || '\u2014'}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search...' },
      filterLabel: 'Contributor',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'jar',
    header: 'Jar',
    cell: ({ row }) => (
      <span className="truncate block">{row.original.jar?.name || '\u2014'}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', typeStyles[row.original.type])}>
        {row.original.type}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'type',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Contribution', value: 'contribution' },
          { label: 'Payout', value: 'payout' },
        ],
      },
      filterLabel: 'Type',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Method',
    cell: ({ row }) => (
      <span>
        {row.original.paymentMethod
          ? paymentMethodLabels[row.original.paymentMethod] || row.original.paymentMethod
          : '\u2014'}
      </span>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'method',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Mobile Money', value: 'mobile-money' },
          { label: 'Cash', value: 'cash' },
          { label: 'Bank', value: 'bank' },
          { label: 'Card', value: 'card' },
          { label: 'Apple Pay', value: 'apple-pay' },
        ],
        popoverWidth: 'w-44',
        displayMap: paymentMethodLabels,
      },
      filterLabel: 'Method',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className={cn('capitalize', statusStyles[row.original.paymentStatus])}>
        {statusLabels[row.original.paymentStatus] || row.original.paymentStatus}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'viaPaymentLink',
    header: 'Via Link',
    cell: ({ row }) =>
      row.original.viaPaymentLink ? (
        <Badge variant="outline" className="bg-indigo-900/40 text-indigo-300 border-indigo-700">
          Yes
        </Badge>
      ) : (
        <span className="text-muted-foreground">No</span>
      ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'link',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        popoverWidth: 'w-36',
        displayMap: { yes: 'Yes', no: 'No' },
      },
      filterLabel: 'Via Link',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'isSettled',
    header: 'Settled',
    cell: ({ row }) =>
      row.original.isSettled ? (
        <Badge variant="outline" className="bg-green-900/40 text-green-300 border-green-700">
          Yes
        </Badge>
      ) : (
        <span className="text-muted-foreground">No</span>
      ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'settled',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
        popoverWidth: 'w-36',
        displayMap: { yes: 'Yes', no: 'No' },
      },
      filterLabel: 'Settled',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'contribution',
    header: 'Contribution',
    cell: ({ row }) => {
      if (row.original.type !== 'contribution') return <span className="text-muted-foreground">—</span>
      return (
        <span
          className={cn(
            'font-medium',
            row.original.paymentStatus === 'failed' ? 'text-muted-foreground line-through' : 'text-green-400',
          )}
        >
          {formatAmount(Math.abs(row.original.amountContributed))}
        </span>
      )
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'payout',
    header: 'Payout',
    cell: ({ row }) => {
      if (row.original.type !== 'payout') return <span className="text-muted-foreground">—</span>
      return (
        <span
          className={cn(
            'font-medium',
            row.original.paymentStatus === 'failed' ? 'text-muted-foreground line-through' : 'text-red-400',
          )}
        >
          -{formatAmount(Math.abs(row.original.amountContributed))}
        </span>
      )
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'platformCharge',
    header: 'Plat. Charge',
    cell: ({ row }) => {
      const charge = row.original.chargesBreakdown?.platformCharge
      if (!charge) return <span className="text-muted-foreground">—</span>
      return <span className="text-muted-foreground">{formatAmount(Math.abs(charge))}</span>
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'eganowFees',
    header: 'Eganow Fees',
    cell: ({ row }) => {
      const fees = row.original.chargesBreakdown?.eganowFees
      if (!fees) return <span className="text-muted-foreground">—</span>
      return <span className="text-muted-foreground">{formatAmount(Math.abs(fees))}</span>
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
      const revenue = row.original.chargesBreakdown?.hogapayRevenue
      if (!revenue) return <span className="text-muted-foreground">—</span>
      return <span className="text-green-400">{formatAmount(Math.abs(revenue))}</span>
    },
    meta: {
      headerClassName: 'text-right',
      cellClassName: 'text-right',
    } satisfies DataTableColumnMeta,
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
    } satisfies DataTableColumnMeta,
  },
]
