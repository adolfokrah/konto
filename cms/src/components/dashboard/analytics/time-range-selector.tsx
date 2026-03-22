'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Range = 'daily' | 'monthly' | 'yearly'

const OPTIONS: { label: string; value: Range }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

export function TimeRangeSelector({ range }: { range: Range }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setRange = (value: Range) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setRange(opt.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            range === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
