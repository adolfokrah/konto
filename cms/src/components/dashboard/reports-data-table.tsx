'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { DataTable } from './data-table/data-table'
import { reportColumns, type ReportRow } from './data-table/columns/report-columns'
import { type PaginationProps } from './data-table/types'
import { deleteReport } from '@/app/(dashboard)/dashboard/jar-reports/actions'

export function ReportsDataTable({
  reports,
  pagination,
  fillParent,
}: {
  reports: ReportRow[]
  pagination?: PaginationProps
  fillParent?: boolean
}) {
  const router = useRouter()

  return (
    <DataTable
      tableId="reports"
      columns={reportColumns}
      data={reports}
      pagination={pagination}
      fillParent={fillParent}
      onRowClick={(report) => router.push(`/dashboard/jars/${report.jarId}`)}
      renderRowActions={(report) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={async (e) => {
                e.stopPropagation()
                const result = await deleteReport(report.id)
                if (result.success) {
                  toast.success('Report dismissed')
                } else {
                  toast.error(result.message)
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Dismiss
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  )
}
