'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { formatShortDate } from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'

export type ReferralRow = {
  id: string
  referredBy: { id: string; firstName: string; lastName: string; email: string } | null
  referral: { id: string; firstName: string; lastName: string; email: string } | null
  referralCode: string
  createdAt: string
}

export const referralColumns: ColumnDef<ReferralRow, any>[] = [
  {
    accessorKey: 'referredBy',
    header: 'Referrer',
    cell: ({ row }) => {
      const u = row.original.referredBy
      if (!u) return <span className="text-muted-foreground">—</span>
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim()
      return (
        <Link href={`/dashboard/users/${u.id}`} className="hover:underline font-medium">
          {name || u.email}
        </Link>
      )
    },
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search referrer...' },
      filterLabel: 'Referrer',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'referral',
    header: 'Referred User',
    cell: ({ row }) => {
      const u = row.original.referral
      if (!u) return <span className="text-muted-foreground">—</span>
      const name = `${u.firstName || ''} ${u.lastName || ''}`.trim()
      return (
        <Link href={`/dashboard/users/${u.id}`} className="hover:underline">
          {name || u.email}
        </Link>
      )
    },
  },
  {
    accessorKey: 'referralCode',
    header: 'Code',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.referralCode || '—'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>
    ),
    meta: {
      filter: { type: 'dateRange', fromParamKey: 'from', toParamKey: 'to' },
      filterLabel: 'Date',
      sortKey: 'createdAt',
    } satisfies DataTableColumnMeta,
  },
]
