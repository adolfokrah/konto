'use client'

import { Check } from 'lucide-react'
import { cn } from '@/utilities/ui'

type Props = {
  options: { label: string; value: string }[]
  currentValue: string
  onSelect: (value: string) => void
}

export function DataTableOptionsList({ options, currentValue, onSelect }: Props) {
  return (
    <div className="flex flex-col">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={cn(
            'flex items-center justify-between px-3 py-1.5 text-left text-sm rounded-md hover:bg-muted transition-colors',
            currentValue === opt.value && 'bg-muted font-medium',
          )}
        >
          {opt.label}
          {currentValue === opt.value && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>
      ))}
    </div>
  )
}
