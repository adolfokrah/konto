'use client'

import { DataTable } from './data-table/data-table'
import { referralBonusColumns, type ReferralBonusRow } from './data-table/columns/referral-bonus-columns'
import { type PaginationProps } from './data-table/types'

export function ReferralBonusesDataTable({
  bonuses,
  pagination,
}: {
  bonuses: ReferralBonusRow[]
  pagination?: PaginationProps
}) {
  return (
    <DataTable
      tableId="referral-bonuses"
      columns={referralBonusColumns}
      data={bonuses}
      pagination={pagination}
      scrollOffset="20rem"
    />
  )
}
