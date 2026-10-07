import { cn } from '@/utilities/ui'
import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string
  description?: string
  /** Kept for call-site compatibility; the v4 KPI tile has no icon. */
  icon?: LucideIcon
  valueClassName?: string
  /** Tone of the description line. */
  tone?: 'pos' | 'neg' | 'warn'
}

const toneClass = { pos: 'text-[#0F9F61]', neg: 'text-[#E5483D]', warn: 'text-[#D9840A]' }

export function MetricCard({ title, value, description, valueClassName, tone }: Props) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3.5">
      <div className="text-[11.5px] text-muted-foreground">{title}</div>
      <div
        className={cn(
          'mt-1 font-chillax text-2xl font-semibold tracking-tight tabular-nums',
          valueClassName,
        )}
      >
        {value}
      </div>
      {description && (
        <p className={cn('mt-0.5 text-[11px]', tone ? toneClass[tone] : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  )
}
