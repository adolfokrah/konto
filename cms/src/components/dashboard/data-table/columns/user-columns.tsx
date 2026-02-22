'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import {
  kycStatusStyles,
  kycStatusLabels,
  roleLabels,
  formatShortDate,
} from '@/components/dashboard/table-constants'
import { type DataTableColumnMeta } from '../types'

export type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  countryCode: string | null
  country: string
  kycStatus: 'none' | 'in_review' | 'verified'
  kycSessionId: string | null
  role: 'user' | 'admin'
  demoUser: boolean
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
  createdAt: string
}

export const userColumns: ColumnDef<UserRow, any>[] = [
  {
    accessorKey: 'firstName',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search name or phone...' },
      filterLabel: 'Name',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.countryCode ? `${row.original.countryCode} ` : ''}
        {row.original.phoneNumber}
      </span>
    ),
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => <span>{row.original.country || '\u2014'}</span>,
  },
  {
    accessorKey: 'kycStatus',
    header: 'KYC',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(kycStatusStyles[row.original.kycStatus] || '')}
      >
        {kycStatusLabels[row.original.kycStatus] || row.original.kycStatus}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'kyc',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Not Verified', value: 'none' },
          { label: 'In Review', value: 'in_review' },
          { label: 'Verified', value: 'verified' },
        ],
        displayMap: kycStatusLabels,
      },
      filterLabel: 'KYC Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          row.original.role === 'admin'
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : 'bg-gray-100 text-gray-800 border-gray-200',
        )}
      >
        {roleLabels[row.original.role] || row.original.role}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'role',
        options: [
          { label: 'All', value: 'all' },
          { label: 'User', value: 'user' },
          { label: 'Admin', value: 'admin' },
        ],
        popoverWidth: 'w-36',
        displayMap: roleLabels,
      },
      filterLabel: 'Role',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatShortDate(row.original.createdAt)}</span>
    ),
  },
]
