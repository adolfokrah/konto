'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CalendarDays, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DataTableDateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const clearDates = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const hasDateFilter = from || to

  return (
    <div className="flex items-center gap-2 text-sm">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <input
        type="date"
        value={from}
        onChange={(e) => updateParam('from', e.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      />
      <span className="text-muted-foreground">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => updateParam('to', e.target.value)}
        className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
      />
      {hasDateFilter && (
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearDates}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
