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

  /** Toggle a single value within a comma-separated param (for multi-select filters) */
  const toggleParam = useCallback(
    (key: string, value: string) => {
      if (value === 'all') {
        // "All" clears the filter
        updateParam(key, '')
        return
      }

      const current = searchParams.get(key) || ''
      const values = current ? current.split(',') : []

      if (values.includes(value)) {
        // Remove value
        const next = values.filter((v) => v !== value)
        updateParam(key, next.join(','))
      } else {
        // Add value
        values.push(value)
        updateParam(key, values.join(','))
      }
    },
    [searchParams, updateParam],
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
        const values = rawValue.split(',')
        const display = values.map((v) => config.displayMap?.[v] || v).join(', ')
        filters.push({
          paramKey: config.paramKey,
          label: meta.filterLabel || config.paramKey,
          displayValue: display,
        })
      }
    }
    return filters
  }, [columns, searchParams])

  return { updateParam, toggleParam, getParam, clearAll, activeFilters }
}
