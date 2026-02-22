'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type Props = {
  currentPage: number
  totalPages: number
}

export function JarsPagination({ currentPage, totalPages }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page > 1) {
      params.set('page', String(page))
    } else {
      params.delete('page')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Build visible page numbers: first, last, and neighbors of current
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
  )

  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious onClick={() => goToPage(currentPage - 1)} />
            </PaginationItem>
          )}
          {pages.map((p, idx) => {
            const elements = []
            if (idx > 0 && p - pages[idx - 1] > 1) {
              elements.push(
                <PaginationItem key={`ellipsis-${p}`}>
                  <PaginationEllipsis />
                </PaginationItem>,
              )
            }
            elements.push(
              <PaginationItem key={p}>
                <PaginationLink isActive={p === currentPage} onClick={() => goToPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>,
            )
            return elements
          })}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext onClick={() => goToPage(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  )
}
