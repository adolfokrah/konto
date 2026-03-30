'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { type DataTableColumnMeta } from '../types'

export type SmsCampaignRow = {
  id: string
  message: string
  status: string
  targetAudience: string
  sentAt: string | null
  recipientCount: number
  successCount: number
  failureCount: number
  createdAt: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

const audienceLabel: Record<string, string> = {
  all: 'All Users',
  android: 'Android',
  ios: 'iOS',
  selected: 'Selected',
}

export const smsCampaignColumns: ColumnDef<SmsCampaignRow, any>[] = [
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => (
      <span className="line-clamp-2 text-sm">{row.original.message}</span>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search messages...' },
      filterLabel: 'Message',
    } satisfies DataTableColumnMeta,
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
          { label: 'Draft', value: 'draft' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'targetAudience',
    header: 'Audience',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {audienceLabel[row.original.targetAudience] || row.original.targetAudience}
      </span>
    ),
  },
  {
    id: 'delivery',
    header: 'Delivery',
    cell: ({ row }) => {
      const { status, successCount, recipientCount } = row.original
      if (status === 'draft') return <span className="text-muted-foreground">—</span>
      if (status === 'sending') return <span className="text-yellow-600">Sending...</span>
      return <span className="text-sm">{successCount} / {recipientCount}</span>
    },
  },
  {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const { sentAt, createdAt } = row.original
      const d = sentAt || createdAt
      return <span className="text-muted-foreground text-sm">{formatDate(d)}</span>
    },
    meta: {
      filter: { type: 'dateRange', fromParamKey: 'from', toParamKey: 'to' },
      filterLabel: 'Date',
    } satisfies DataTableColumnMeta,
  },
]
