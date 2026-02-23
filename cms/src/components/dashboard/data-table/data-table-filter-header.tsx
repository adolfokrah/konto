'use client'

import { useState } from 'react'
import { type Header, flexRender } from '@tanstack/react-table'
import { ListFilter } from 'lucide-react'
import { type DateRange, getDefaultClassNames } from 'react-day-picker'
import { TableHead } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/utilities/ui'
import { DataTableOptionsList } from './data-table-options-list'
import { type DataTableColumnMeta } from './types'

type Props<TData> = {
  header: Header<TData, unknown>
  readOnly?: boolean
  getParam: (key: string) => string
  updateParam: (key: string, value: string) => void
  batchUpdateParams: (updates: { key: string; value: string }[]) => void
  toggleParam: (key: string, value: string) => void
}

const rdpDefaults = getDefaultClassNames()

function DateRangeFilter({
  fromParamKey,
  toParamKey,
  getParam,
  batchUpdateParams,
}: {
  fromParamKey: string
  toParamKey: string
  getParam: (key: string) => string
  batchUpdateParams: (updates: { key: string; value: string }[]) => void
}) {
  const fromStr = getParam(fromParamKey)
  const toStr = getParam(toParamKey)

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = fromStr ? new Date(fromStr + 'T00:00:00') : undefined
    const to = toStr ? new Date(toStr + 'T00:00:00') : undefined
    return from || to ? { from, to } : undefined
  })

  const formatDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)
    const updates: { key: string; value: string }[] = []
    updates.push({
      key: fromParamKey,
      value: newRange?.from ? formatDate(newRange.from) : '',
    })
    updates.push({
      key: toParamKey,
      value: newRange?.to ? formatDate(newRange.to) : '',
    })
    batchUpdateParams(updates)
  }

  const handleClear = () => {
    setRange(undefined)
    batchUpdateParams([
      { key: fromParamKey, value: '' },
      { key: toParamKey, value: '' },
    ])
  }

  const hasFilter = fromStr || toStr

  return (
    <div className="flex flex-col">
      <Calendar
        mode="range"
        selected={range}
        onSelect={handleSelect}
        numberOfMonths={2}
        classNames={{
          root: 'w-full',
          today: cn(
            'ring-1 ring-primary rounded-md data-[selected=true]:rounded-none',
            rdpDefaults.today,
          ),
          range_start: cn('bg-primary/20 rounded-l-md', rdpDefaults.range_start),
          range_end: cn('bg-primary/20 rounded-r-md', rdpDefaults.range_end),
          range_middle: cn('bg-primary/10 rounded-none', rdpDefaults.range_middle),
        }}
        className="[--cell-size:2.5rem]"
      />
      {hasFilter && (
        <div className="border-t px-3 pb-2">
          <Button variant="ghost" size="sm" className="h-7 w-full text-xs" onClick={handleClear}>
            Clear dates
          </Button>
        </div>
      )}
    </div>
  )
}

export function DataTableFilterHeader<TData>({
  header,
  readOnly,
  getParam,
  updateParam,
  batchUpdateParams,
  toggleParam,
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

  const isDateRange = filter.type === 'dateRange'
  const rawValue = isDateRange ? '' : getParam(filter.paramKey)
  const isActive = isDateRange
    ? !!(getParam(filter.fromParamKey) || getParam(filter.toParamKey))
    : filter.type === 'search'
      ? !!rawValue
      : !!rawValue && rawValue !== 'all'
  const selectedValues = filter.type === 'select' && rawValue ? rawValue.split(',') : []

  return (
    <TableHead className={headerClassName}>
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            'flex w-full items-center justify-between cursor-pointer hover:text-foreground transition-colors',
            isActive && 'text-foreground',
          )}>
            {label}
            {isActive ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <ListFilter className="h-3 w-3 text-primary-foreground" />
              </span>
            ) : (
              <ListFilter className="h-3 w-3" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            isDateRange ? 'w-[600px] p-0' : 'p-2',
            !isDateRange &&
              (filter.popoverWidth || (filter.type === 'search' ? 'w-56' : 'w-40')),
          )}
          align="start"
        >
          {filter.type === 'search' ? (
            <div className="p-1">
              <Input
                placeholder={filter.placeholder || 'Search...'}
                defaultValue={rawValue}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateParam(filter.paramKey, e.currentTarget.value)
                  }
                }}
                className="h-8"
              />
              {rawValue && (
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
          ) : filter.type === 'dateRange' ? (
            <DateRangeFilter
              fromParamKey={filter.fromParamKey}
              toParamKey={filter.toParamKey}
              getParam={getParam}
              batchUpdateParams={batchUpdateParams}
            />
          ) : (
            <DataTableOptionsList
              options={filter.options}
              selectedValues={selectedValues}
              onToggle={(v) => toggleParam(filter.paramKey, v)}
            />
          )}
        </PopoverContent>
      </Popover>
    </TableHead>
  )
}
