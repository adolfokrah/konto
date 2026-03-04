'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { DataTable } from './data-table/data-table'
import { campaignColumns, type CampaignRow } from './data-table/columns/campaign-columns'
import { type PaginationProps } from './data-table/types'
import { deleteCampaign } from '@/app/(dashboard)/dashboard/push-notifications/actions'

export function CampaignsDataTable({
  campaigns,
  pagination,
}: {
  campaigns: CampaignRow[]
  pagination?: PaginationProps
}) {
  const router = useRouter()

  return (
    <DataTable
      columns={campaignColumns}
      data={campaigns}
      pagination={pagination}
      scrollOffset="20rem"
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
                router.push(`/dashboard/push-notifications/compose?duplicate=${campaign.id}`)
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
              <DropdownMenuItem
                onClick={async (e) => {
                  e.stopPropagation()
                  const result = await deleteCampaign(campaign.id)
                  if (result.success) {
                    toast.success('Campaign deleted')
                  } else {
                    toast.error(result.message)
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  )
}
