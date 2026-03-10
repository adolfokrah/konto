'use client'

import { DataTable } from './data-table/data-table'
import { referralColumns, type ReferralRow } from './data-table/columns/referral-columns'
import { type PaginationProps } from './data-table/types'

export function ReferralsDataTable({
  referrals,
  pagination,
}: {
  referrals: ReferralRow[]
  pagination?: PaginationProps
}) {
  return (
    <DataTable
      tableId="referrals"
      columns={referralColumns}
      data={referrals}
      pagination={pagination}
      scrollOffset="20rem"
    />
  )
}
