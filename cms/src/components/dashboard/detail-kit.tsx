import type { ReactNode } from 'react'
import { cn } from '@/utilities/ui'

/** v4 detail card: white, 16px radius, Chillax title. */
export function DetailCard({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl bg-card p-4', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="font-chillax text-[15px] font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Label/value rows in a two-column grid (v4 `.dl`). Rows with empty values are skipped. */
export function DetailList({
  rows,
  labelWidth = 140,
}: {
  rows: [ReactNode, ReactNode | null | undefined | false][]
  labelWidth?: number
}) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== false && v !== '')
  return (
    <dl
      className="grid gap-x-3 gap-y-2.5 text-[12.5px]"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(0, 1fr)` }}
    >
      {visible.map(([label, value], i) => (
        <div key={i} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Small stat tile used in "quick facts" rows on detail pages. */
export function FactTile({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-2xl bg-card px-4 py-3">
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[14px] font-semibold">{value}</div>
    </div>
  )
}
