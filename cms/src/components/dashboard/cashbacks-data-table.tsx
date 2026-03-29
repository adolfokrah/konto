'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DataTable } from './data-table/data-table'
import { cashbackColumns, type CashbackRow } from './data-table/columns/cashback-columns'
import { type PaginationProps, type BulkAction } from './data-table/types'
import { CashbackDetailSheet } from './cashback-detail-sheet'
import { toggleCashbackPaid, bulkUpdateCashbackPaid } from '@/app/(dashboard)/dashboard/cashbacks/actions'
import { CheckCircle2, Circle } from 'lucide-react'

export function CashbacksDataTable({
  cashbacks,
  pagination,
}: {
  cashbacks: CashbackRow[]
  pagination?: PaginationProps
}) {
  const router = useRouter()
  const [openSheet, setOpenSheet] = useState<CashbackRow | null>(null)
  const [, startTransition] = useTransition()

  const handleTogglePaid = (id: string, isPaid: boolean) => {
    if (openSheet?.id === id) {
      setOpenSheet((prev) => (prev ? { ...prev, isPaid } : prev))
    }
    startTransition(async () => {
      try {
        await toggleCashbackPaid(id, isPaid)
        router.refresh()
      } catch {
        toast.error('Failed to update cashback')
      }
    })
  }

  const bulkActions: BulkAction<CashbackRow>[] = useMemo(
    () => [
      {
        label: 'Mark Paid',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: 'border-green-800 text-green-400 hover:bg-green-900/20 hover:text-green-300',
        onClick: (rows, clearSelection) => {
          const ids = rows.map((r) => r.id)
          startTransition(async () => {
            try {
              await bulkUpdateCashbackPaid(ids, true)
              clearSelection()
              toast.success(`${ids.length} cashback${ids.length !== 1 ? 's' : ''} marked as paid`)
              router.refresh()
            } catch {
              toast.error('Failed to update cashbacks')
            }
          })
        },
      },
      {
        label: 'Mark Unpaid',
        icon: <Circle className="h-3.5 w-3.5" />,
        className: 'border-yellow-800 text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300',
        onClick: (rows, clearSelection) => {
          const ids = rows.map((r) => r.id)
          startTransition(async () => {
            try {
              await bulkUpdateCashbackPaid(ids, false)
              clearSelection()
              toast.success(`${ids.length} cashback${ids.length !== 1 ? 's' : ''} marked as unpaid`)
              router.refresh()
            } catch {
              toast.error('Failed to update cashbacks')
            }
          })
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const tableMeta = useMemo(() => ({ onTogglePaid: handleTogglePaid }), [openSheet])

  return (
    <>
      <DataTable
        tableId="cashbacks"
        columns={cashbackColumns}
        data={cashbacks}
        pagination={pagination}
        fillParent
        onRowClick={setOpenSheet}
        bulkActions={bulkActions}
        tableMeta={tableMeta}
      />

      <CashbackDetailSheet
        selected={openSheet}
        onClose={() => setOpenSheet(null)}
        onTogglePaid={handleTogglePaid}
      />
    </>
  )
}
