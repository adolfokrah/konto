'use client'

import { type Header, flexRender } from '@tanstack/react-table'
import { ListFilter } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { DataTableOptionsList } from './data-table-options-list'
import { type DataTableColumnMeta } from './types'

type Props<TData> = {
  header: Header<TData, unknown>
  readOnly?: boolean
  getParam: (key: string) => string
  updateParam: (key: string, value: string) => void
}

export function DataTableFilterHeader<TData>({
  header,
  readOnly,
  getParam,
  updateParam,
}: Props<TData>) {
  const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined
  const filter = meta?.filter
  const headerClassName = meta?.headerClassName

  const label = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext())

  if (!filter || readOnly) {
    return <TableHead className={headerClassName}>{label}</TableHead>
  }

  const currentValue =
    filter.type === 'search' ? getParam(filter.paramKey) : getParam(filter.paramKey) || 'all'
  const isActive = filter.type === 'search' ? !!currentValue : currentValue !== 'all'

  return (
    <TableHead className={headerClassName}>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex w-full items-center justify-between cursor-pointer hover:text-foreground transition-colors">
            {label}
            <ListFilter className={cn('h-3 w-3', isActive && 'text-primary')} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('p-2', filter.popoverWidth || (filter.type === 'search' ? 'w-56' : 'w-40'))}
          align="start"
        >
          {filter.type === 'search' ? (
            <div className="p-1">
              <Input
                placeholder={filter.placeholder || 'Search...'}
                defaultValue={currentValue}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateParam(filter.paramKey, e.currentTarget.value)
                  }
                }}
                className="h-8"
              />
              {currentValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs"
                  onClick={() => updateParam(filter.paramKey, '')}
                >
                  Clear
                </Button>
              )}
            </div>
          ) : (
            <DataTableOptionsList
              options={filter.options}
              currentValue={currentValue}
              onSelect={(v) => updateParam(filter.paramKey, v)}
            />
          )}
        </PopoverContent>
      </Popover>
    </TableHead>
  )
}
