'use client'

import { DataTable } from './data-table/data-table'
import { collectorColumns, type CollectorRow } from './data-table/columns/collector-columns'

export function CollectorsDataTable({ collectors }: { collectors: CollectorRow[] }) {
  return <DataTable columns={collectorColumns} data={collectors} readOnly />
}
