'use client'

import { Check } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  options: { label: string; value: string }[]
  selectedValues: string[]
  onToggle: (value: string) => void
}

export function DataTableOptionsList({ options, selectedValues, onToggle }: Props) {
  return (
    <div className="flex flex-col">
      {options.map((opt) => {
        const isSelected =
          opt.value === 'all'
            ? selectedValues.length === 0
            : selectedValues.includes(opt.value)

        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={cn(
              'flex items-center justify-between px-3 py-1.5 text-left text-sm rounded-md hover:bg-muted transition-colors',
              isSelected && 'bg-muted font-medium',
            )}
          >
            {opt.label}
            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
