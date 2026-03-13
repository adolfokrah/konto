'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { RefundStatusBadge } from '@/components/dashboard/refund-status-badge'
import { AutoRefundActions } from '@/components/dashboard/auto-refund-actions'
import { type AutoRefundRow, type AutoRefundItem } from '@/components/dashboard/data-table/columns/auto-refund-columns'

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type Props = {
  group: AutoRefundRow | null
  onClose: () => void
}

export function AutoRefundGroupSheet({ group, onClose }: Props) {
  return (
    <Sheet open={!!group} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {group && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>{group.jarName}</SheetTitle>
              <SheetDescription>
                {group.contributors} contributor{group.contributors !== 1 ? 's' : ''} · {formatAmount(group.totalAmount, group.currency)} total
              </SheetDescription>
            </SheetHeader>

            {group.status === 'awaiting_approval' && (
              <div className="mb-6">
                <AutoRefundActions jarId={group.jarId} />
              </div>
            )}

            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.accountName || '—'}</span>
                    <RefundStatusBadge status={item.status} />
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between">
                    <span className="font-mono text-xs">{item.accountNumber || '—'} · {item.mobileMoneyProvider || '—'}</span>
                    <span className={`font-medium ${item.status === 'failed' || item.status === 'rejected' ? 'line-through opacity-50 text-red-400' : 'text-red-400'}`}>
                      {formatAmount(item.amount, group.currency)}
                    </span>
                  </div>
                  {item.transactionReference && (
                    <div className="font-mono text-xs text-muted-foreground">
                      Ref: {item.transactionReference}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
