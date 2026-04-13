'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from './data-table/data-table'
import { smsCampaignColumns, type SmsCampaignRow } from './data-table/columns/sms-campaign-columns'
import { type PaginationProps } from './data-table/types'

export function SmsCampaignsDataTable({
  campaigns,
  pagination,
  fillParent,
}: {
  campaigns: SmsCampaignRow[]
  pagination?: PaginationProps
  fillParent?: boolean
}) {
  const router = useRouter()

  return (
    <DataTable
      tableId="sms-campaigns"
      columns={smsCampaignColumns}
      data={campaigns}
      pagination={pagination}
      fillParent={fillParent}
      renderRowActions={(campaign) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/dashboard/sms/compose?duplicate=${campaign.id}`)
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  )
}
