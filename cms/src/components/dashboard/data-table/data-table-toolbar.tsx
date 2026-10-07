'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/utilities/ui'
import { DataTableOptionsList } from './data-table-options-list'
import { DateRangeFilter } from './data-table-filter-header'
import { type ColumnFilterConfig, type DataTableColumnMeta } from './types'

type Props<TData> = {
  columns: ColumnDef<TData, any>[]
  getParam: (key: string) => string
  updateParam: (key: string, value: string) => void
  batchUpdateParams: (updates: { key: string; value: string }[]) => void
  toggleParam: (key: string, value: string) => void
}

const MAX_SELECT_CHIPS = 3

type ToolbarFilter = { label: string; filter: ColumnFilterConfig }

function collectFilters<TData>(columns: ColumnDef<TData, any>[]): ToolbarFilter[] {
  const out: ToolbarFilter[] = []
  for (const col of columns) {
    const meta = col.meta as DataTableColumnMeta | undefined
    if (!meta?.filter) continue
    const header = typeof col.header === 'string' ? col.header : undefined
    out.push({ label: meta.filterLabel ?? header ?? 'Filter', filter: meta.filter })
  }
  return out
}

/** v4 table toolbar: one search box plus a chip per remaining column filter. */
export function DataTableToolbar<TData>({
  columns,
  getParam,
  updateParam,
  batchUpdateParams,
  toggleParam,
}: Props<TData>) {
  const filters = collectFilters(columns)
  if (filters.length === 0) return null

  // Prefer the general "search" param; ID/reference lookups go under "More".
  const generalIndex = filters.findIndex(
    (f) => f.filter.type === 'search' && f.filter.paramKey === 'search',
  )
  const primaryIndex =
    generalIndex >= 0 ? generalIndex : filters.findIndex((f) => f.filter.type === 'search')
  const primary = primaryIndex >= 0 ? filters[primaryIndex] : null
  const rest = filters.filter((_, i) => i !== primaryIndex)
  // v4 shows a few chips; the rest go under "More" so the toolbar stays on one line.
  const selects = rest.filter((f) => f.filter.type === 'select')
  const dates = rest.filter((f) => f.filter.type === 'dateRange')
  const chips = [...selects.slice(0, MAX_SELECT_CHIPS), ...dates]
  const moreSearches = [
    ...selects.slice(MAX_SELECT_CHIPS),
    ...rest.filter((f) => f.filter.type === 'search'),
  ]

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {primary && primary.filter.type === 'search' && (
        <SearchBox
          key={getParam(primary.filter.paramKey)}
          paramKey={primary.filter.paramKey}
          placeholder={primary.filter.placeholder ?? 'Search'}
          value={getParam(primary.filter.paramKey)}
          onSubmit={updateParam}
        />
      )}
      {chips.map(({ label, filter }) => (
        <FilterChip
          key={label + ('paramKey' in filter ? filter.paramKey : filter.fromParamKey)}
          label={label}
          filter={filter}
          getParam={getParam}
          updateParam={updateParam}
          batchUpdateParams={batchUpdateParams}
          toggleParam={toggleParam}
        />
      ))}
      {moreSearches.length > 0 && (
        <MoreFilters
          filters={moreSearches}
          getParam={getParam}
          updateParam={updateParam}
          toggleParam={toggleParam}
        />
      )}
    </div>
  )
}

function MoreFilters({
  filters,
  getParam,
  updateParam,
  toggleParam,
}: {
  filters: ToolbarFilter[]
  getParam: (key: string) => string
  updateParam: (key: string, value: string) => void
  toggleParam: (key: string, value: string) => void
}) {
  const activeCount = filters.filter((f) => {
    if (f.filter.type === 'dateRange') return false
    const v = getParam(f.filter.paramKey)
    return !!v && v !== 'all'
  }).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-[30px] items-center gap-1.5 rounded-[10px] px-[11px] text-[12px] font-medium transition-colors',
            activeCount
              ? 'bg-primary text-primary-foreground'
              : 'border bg-card text-foreground hover:bg-secondary',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More{activeCount ? ` · ${activeCount}` : ''}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-2.5 p-3">
        {filters.map(({ label, filter }) =>
          filter.type === 'search' ? (
            <label key={filter.paramKey} className="block space-y-1">
              <span className="text-[11.5px] text-muted-foreground">{label}</span>
              <Input
                key={getParam(filter.paramKey)}
                placeholder={filter.placeholder || 'Search...'}
                defaultValue={getParam(filter.paramKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updateParam(filter.paramKey, e.currentTarget.value)
                }}
                className="h-8"
              />
            </label>
          ) : filter.type === 'select' ? (
            <div key={filter.paramKey} className="space-y-1">
              <span className="text-[11.5px] text-muted-foreground">{label}</span>
              <div className="flex flex-wrap gap-1">
                {filter.options
                  .filter((o) => o.value !== 'all')
                  .map((o) => {
                    const raw = getParam(filter.paramKey)
                    const on = raw ? raw.split(',').includes(o.value) : false
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggleParam(filter.paramKey, o.value)}
                        className={cn(
                          'h-7 rounded-lg px-2.5 text-[12px] font-medium',
                          on
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground',
                        )}
                      >
                        {o.label}
                      </button>
                    )
                  })}
              </div>
            </div>
          ) : null,
        )}
        <p className="text-[11px] text-muted-foreground">Press Enter to apply text filters.</p>
      </PopoverContent>
    </Popover>
  )
}

function SearchBox({
  paramKey,
  placeholder,
  value,
  onSubmit,
}: {
  paramKey: string
  placeholder: string
  value: string
  onSubmit: (key: string, value: string) => void
}) {
  return (
    <form
      className="flex h-[34px] w-[220px] items-center gap-2 rounded-xl border bg-card px-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(paramKey, new FormData(e.currentTarget).get('q')?.toString().trim() ?? '')
      }}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        name="q"
        defaultValue={value}
        placeholder={placeholder.replace(/\.\.\.$/, '')}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-[12.5px] outline-none placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onSubmit(paramKey, '')}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  )
}

function FilterChip({
  label,
  filter,
  getParam,
  updateParam,
  batchUpdateParams,
  toggleParam,
}: {
  label: string
  filter: ColumnFilterConfig
  getParam: (key: string) => string
  updateParam: (key: string, value: string) => void
  batchUpdateParams: (updates: { key: string; value: string }[]) => void
  toggleParam: (key: string, value: string) => void
}) {
  let summary = ''
  if (filter.type === 'dateRange') {
    const from = getParam(filter.fromParamKey)
    const to = getParam(filter.toParamKey)
    summary = from || to ? [from, to].filter(Boolean).join(' – ') : ''
  } else {
    const raw = getParam(filter.paramKey)
    if (filter.type === 'select' && raw && raw !== 'all') {
      const values = raw.split(',')
      summary =
        values.length > 1
          ? `${values.length}`
          : (filter.displayMap?.[values[0]] ??
            filter.options.find((o) => o.value === values[0])?.label ??
            values[0])
    } else if (filter.type === 'search') {
      summary = raw
    }
  }
  const active = summary !== ''

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-[30px] items-center gap-1.5 rounded-[10px] px-[11px] text-[12px] font-medium transition-colors',
            active
              ? 'bg-primary text-primary-foreground'
              : 'border bg-card text-foreground hover:bg-secondary',
          )}
        >
          {label}
          {active && <span className="max-w-[120px] truncate font-semibold">: {summary}</span>}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          filter.type === 'dateRange' ? 'w-[600px] p-0' : 'p-2',
          filter.type !== 'dateRange' &&
            (filter.popoverWidth || (filter.type === 'search' ? 'w-56' : 'w-44')),
        )}
      >
        {filter.type === 'search' ? (
          <div className="p-1">
            <Input
              placeholder={filter.placeholder || 'Search...'}
              defaultValue={getParam(filter.paramKey)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParam(filter.paramKey, e.currentTarget.value)
              }}
              className="h-8"
            />
            {getParam(filter.paramKey) && (
              <button
                type="button"
                className="mt-2 h-7 w-full rounded-lg text-xs text-muted-foreground hover:bg-secondary"
                onClick={() => updateParam(filter.paramKey, '')}
              >
                Clear
              </button>
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
            selectedValues={(() => {
              const raw = getParam(filter.paramKey)
              return raw ? raw.split(',') : []
            })()}
            onToggle={(v) => toggleParam(filter.paramKey, v)}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
