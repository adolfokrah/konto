'use client'

import { type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { BusinessVerificationStatusBadge } from '@/components/dashboard/business-verification-status-badge'
import { type DataTableColumnMeta } from '../types'

export type BusinessVerificationRow = {
  id: string
  businessName: string
  userId: string | null
  userName: string
  userEmail: string | null
  status: 'pending' | 'under-review' | 'approved' | 'rejected'
  createdAt: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const businessVerificationColumns: ColumnDef<BusinessVerificationRow, any>[] = [
  {
    accessorKey: 'businessName',
    header: 'Business',
    cell: ({ row }) =>
      row.original.userId ? (
        <Link
          href={`/dashboard/users/${row.original.userId}?tab=kyb`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.original.businessName}
        </Link>
      ) : (
        <span className="font-medium">{row.original.businessName}</span>
      ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search by business or user…' },
      filterLabel: 'Business',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'userName',
    header: 'User',
    cell: ({ row }) => {
      const { userId, userName, userEmail } = row.original
      const content = (
        <div className="flex flex-col">
          <span className="font-medium">{userName}</span>
          {userEmail ? (
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          ) : null}
        </div>
      )
      return userId ? (
        <Link
          href={`/dashboard/users/${userId}`}
          className="hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </Link>
      ) : (
        content
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <BusinessVerificationStatusBadge status={row.original.status} />,
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Under Review', value: 'under-review' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
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
