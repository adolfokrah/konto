'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type PaginationProps } from './types'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function DataTablePagination({
  currentPage,
  totalPages,
  totalRows,
  rowsPerPage,
}: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function goToPage(page: number) {
    navigate({ page: page > 1 ? String(page) : null })
  }

  function changePageSize(size: string) {
    navigate({ limit: size === '20' ? null : size, page: null })
  }

  const from = (currentPage - 1) * rowsPerPage + 1
  const to = Math.min(currentPage * rowsPerPage, totalRows)

  return (
    <div className="mt-3 flex items-center justify-between gap-4 px-1">
      <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
        <span>
          Showing {totalRows === 0 ? 0 : from.toLocaleString()}–{to.toLocaleString()} of{' '}
          {totalRows.toLocaleString()}
        </span>
        <Select value={String(rowsPerPage)} onValueChange={changePageSize}>
          <SelectTrigger className="h-7 w-[92px] text-[11.5px]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-1 text-[11.5px] tabular-nums text-muted-foreground">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="h-8 rounded-[9px] bg-secondary px-3 text-[12.5px] font-semibold text-foreground transition-opacity disabled:opacity-40"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-8 rounded-[9px] bg-primary px-3 text-[12.5px] font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
