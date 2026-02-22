'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCallback } from 'react'

export function JarsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('search') || ''
  const currentStatus = searchParams.get('status') || 'all'

  const updateParams = useCallback(
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        placeholder="Search jars..."
        defaultValue={currentSearch}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateParams('search', e.currentTarget.value)
          }
        }}
        className="max-w-sm"
      />
      <Select defaultValue={currentStatus} onValueChange={(value) => updateParams('status', value)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="frozen">Frozen</SelectItem>
          <SelectItem value="sealed">Sealed</SelectItem>
          <SelectItem value="broken">Broken</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
