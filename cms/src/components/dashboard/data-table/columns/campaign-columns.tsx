'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utilities/ui'
import { type DataTableColumnMeta } from '../types'

export type CampaignRow = {
  id: string
  title: string
  message: string
  status: string
  targetAudience: string
  scheduledFor: string | null
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
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

export const campaignColumns: ColumnDef<CampaignRow, any>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className="min-w-[200px]">
        <span className="truncate block font-medium">{row.original.title}</span>
        <span className="truncate block text-xs text-muted-foreground max-w-[300px]">
          {row.original.message}
        </span>
      </div>
    ),
    meta: {
      filter: { type: 'search', paramKey: 'search', placeholder: 'Search campaigns...' },
      filterLabel: 'Title',
    } satisfies DataTableColumnMeta,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn('capitalize', statusStyles[row.original.status])}
      >
        {row.original.status}
      </Badge>
    ),
    meta: {
      filter: {
        type: 'select',
        paramKey: 'status',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
          { label: 'Failed', value: 'failed' },
        ],
      },
      filterLabel: 'Status',
    } satisfies DataTableColumnMeta,
  },
  {
    id: 'delivery',
    header: 'Delivery',
    cell: ({ row }) => {
      const { status, successCount, recipientCount } = row.original
      if (status === 'draft' || status === 'scheduled') {
        return <span className="text-muted-foreground">—</span>
      }
      if (status === 'sending') {
        return <span className="text-yellow-600">Sending...</span>
      }
      return (
        <span className="text-sm">
          {successCount} / {recipientCount}
        </span>
      )
    },
  },
  {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const { status, sentAt, scheduledFor } = row.original
      if (status === 'scheduled' && scheduledFor) {
        return (
          <span className="text-blue-600 text-sm">
            Scheduled: {formatDate(scheduledFor)}
          </span>
        )
      }
      if (sentAt) {
        return <span className="text-muted-foreground text-sm">{formatDate(sentAt)}</span>
      }
      return <span className="text-muted-foreground">—</span>
    },
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
