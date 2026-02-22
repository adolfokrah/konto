'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { type DataTableColumnMeta } from './types'

export type ActiveFilter = {
  paramKey: string
  label: string
  displayValue: string
}

export function useTableFilters<TData>(columns: ColumnDef<TData, any>[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const getParam = useCallback((key: string) => searchParams.get(key) || '', [searchParams])

  const clearAll = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = []
    for (const col of columns) {
      const meta = col.meta as DataTableColumnMeta | undefined
      if (!meta?.filter) continue
      const config = meta.filter
      const rawValue = searchParams.get(config.paramKey) || ''

      if (config.type === 'search' && rawValue) {
        filters.push({
          paramKey: config.paramKey,
          label: meta.filterLabel || config.paramKey,
          displayValue: rawValue,
        })
      } else if (config.type === 'select' && rawValue && rawValue !== 'all') {
        const display = config.displayMap?.[rawValue] || rawValue
        filters.push({
          paramKey: config.paramKey,
          label: meta.filterLabel || config.paramKey,
          displayValue: display,
        })
      }
    }
    return filters
  }, [columns, searchParams])

  return { updateParam, getParam, clearAll, activeFilters }
}
