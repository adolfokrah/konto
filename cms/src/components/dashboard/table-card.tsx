'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/utilities/ui'

type TableCardHeader = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Show the filter toolbar (default true). Off for read-only previews like Overview. */
  filters?: boolean
}

const TableCardContext = createContext<TableCardHeader | null>(null)

/** Read by DataTable so the card title, filters and actions share one row (v4 dcard). */
export function useTableCardHeader() {
  return useContext(TableCardContext)
}

type Props = TableCardHeader & {
  children: ReactNode
  className?: string
}

export function TableCard({
  title,
  description,
  actions,
  filters = true,
  children,
  className,
}: Props) {
  return (
    <TableCardContext.Provider value={{ title, description, actions, filters }}>
      <div
        className={cn('flex min-h-0 flex-col rounded-2xl border bg-card px-4 pb-3 pt-4', className)}
      >
        {children}
      </div>
    </TableCardContext.Provider>
  )
}
