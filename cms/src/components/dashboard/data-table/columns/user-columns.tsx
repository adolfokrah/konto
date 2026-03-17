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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type DataTableColumnMeta } from '../types'
import { PlatformBadge } from '@/components/dashboard/platform-badge'

export type UserRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  countryCode: string | null
  country: string
  photoUrl: string | null
  kycStatus: 'none' | 'in_review' | 'verified'
  kycSessionId: string | null
  role: 'user' | 'admin'
  demoUser: boolean
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
  platform: 'android' | 'ios' | null
  createdAt: string
}

export const userColumns: ColumnDef<UserRow, any>[] = [
  {
    accessorKey: 'firstName',
    header: 'Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          {row.original.photoUrl && <AvatarImage src={row.original.photoUrl} alt={row.original.firstName} />}
          <AvatarFallback className="text-xs">
            {row.original.firstName?.charAt(0)}{row.original.lastName?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
      </div>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search name or phone...' },
      filterLabel: 'Name',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="truncate block text-sm">{row.original.email || '\u2014'}</span>
    ),
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
    accessorKey: 'platform',
    header: 'Platform',
    size: 100,
    cell: ({ row }) => {
      const p = row.original.platform
      if (!p) return <span className="text-muted-foreground">—</span>
      return <PlatformBadge platform={p} />
    },
    meta: {
      filter: {
        type: 'select',
        paramKey: 'platform',
        options: [
          { label: 'All', value: 'all' },
          { label: 'Android', value: 'android' },
          { label: 'iOS', value: 'ios' },
        ],
        popoverWidth: 'w-36',
        displayMap: { android: 'Android', ios: 'iOS' },
      },
      filterLabel: 'Platform',
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
