'use client'

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
  return (
    <DataTable
      tableId="sms-campaigns"
      columns={smsCampaignColumns}
      data={campaigns}
      pagination={pagination}
      fillParent={fillParent}
    />
  )
}
