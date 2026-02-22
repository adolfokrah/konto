'use client'

import { X } from 'lucide-react'
import { type ActiveFilter } from './use-table-filters'

type Props = {
  filters: ActiveFilter[]
  onRemove: (paramKey: string) => void
  onClearAll: () => void
}

export function DataTableActiveFilters({ filters, onRemove, onClearAll }: Props) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {filters.map((f) => (
        <button
          key={f.paramKey}
          onClick={() => onRemove(f.paramKey)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
        >
          <span className="text-muted-foreground">{f.label}:</span>
          <span className="capitalize">{f.displayValue}</span>
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
