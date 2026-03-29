'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Circle, User, Container, Calendar, Tag, DollarSign, Percent } from 'lucide-react'
import Link from 'next/link'
import useSWR from 'swr'
import { type CashbackRow } from './data-table/columns/cashback-columns'

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex items-start justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function CashbackDetailSheet({
  selected,
  onClose,
  onTogglePaid,
}: {
  selected: CashbackRow | null
  onClose: () => void
  onTogglePaid: (id: string, isPaid: boolean) => void
}) {
  const { data: tx } = useSWR<any>(
    selected?.transaction?.id
      ? `/api/transactions/${selected.transaction.id}?depth=0`
      : null,
    fetcher,
  )

  const cb = tx?.chargesBreakdown
  const feePercent =
    cb && selected
      ? (((cb.amountPaidByContributor ?? 0) - selected.originalAmount) / selected.originalAmount) * 100
      : null

  return (
    <Sheet open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {selected && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base">Cashback Details</SheetTitle>
                <Badge
                  variant="outline"
                  className={
                    selected.isPaid
                      ? 'bg-green-900/40 text-green-300 border-green-700'
                      : 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
                  }
                >
                  {selected.isPaid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
              <SheetDescription className="font-mono text-xs">{selected.id}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Summary Banner */}
              <div className="flex items-center gap-3 rounded-lg border border-blue-700 bg-blue-900/20 p-3 text-blue-300">
                <DollarSign className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Discount: {formatAmount(selected.discountAmount)} ({selected.discountPercent}%)
                  </p>
                  <p className="text-xs opacity-70">on {formatAmount(selected.originalAmount)} contribution</p>
                </div>
              </div>

              {/* Contributor */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Contributor</h4>
                <Separator className="mb-2" />
                <DetailRow
                  label="Name"
                  value={selected.contributor || '—'}
                  icon={<User className="h-3.5 w-3.5" />}
                />
                {selected.user && (
                  <DetailRow
                    label="Account"
                    value={
                      <Link
                        href={`/dashboard/users/${selected.user.id}`}
                        className="hover:underline"
                      >
                        {`${selected.user.firstName || ''} ${selected.user.lastName || ''}`.trim() ||
                          selected.user.email}
                      </Link>
                    }
                    icon={<User className="h-3.5 w-3.5" />}
                  />
                )}
              </div>

              {/* Jar & Date */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Contribution</h4>
                <Separator className="mb-2" />
                <DetailRow
                  label="Jar"
                  value={selected.jarName || '—'}
                  icon={<Container className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Amount"
                  value={formatAmount(selected.originalAmount)}
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Date"
                  value={formatFullDate(selected.createdAt)}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
              </div>

              {/* Cashback Breakdown */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Cashback Breakdown</h4>
                <Separator className="mb-2" />
                {feePercent !== null && (
                  <DetailRow
                    label="Fee Charged"
                    value={
                      <span className="font-medium">
                        {feePercent.toFixed(2)}%
                        <span className="text-muted-foreground text-xs ml-1">
                          ({formatAmount(cb.amountPaidByContributor - selected.originalAmount)})
                        </span>
                      </span>
                    }
                    icon={<Percent className="h-3.5 w-3.5" />}
                  />
                )}
                <DetailRow
                  label="Discount %"
                  value={<span className="text-blue-400 font-medium">{selected.discountPercent}%</span>}
                  icon={<Tag className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Discount Amount"
                  value={
                    <span className="text-green-400 font-semibold">
                      {formatAmount(selected.discountAmount)}
                    </span>
                  }
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Hogapay Revenue"
                  value={
                    <span className="text-muted-foreground">{formatAmount(selected.hogapayRevenue)}</span>
                  }
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                />
              </div>

              {/* Linked Transaction */}
              {selected.transaction && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Linked Transaction</h4>
                  <Separator className="mb-2" />
                  <DetailRow
                    label="Transaction ID"
                    value={
                      <span className="font-mono text-xs">{selected.transaction.id}</span>
                    }
                  />
                </div>
              )}

              {/* Paid Status Toggle */}
              <div>
                <Separator className="mb-4" />
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  {selected.isPaid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1">
                    <Label htmlFor="isPaid-toggle" className="text-sm font-medium cursor-pointer">
                      Mark as Paid
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {selected.isPaid
                        ? 'This cashback has been settled'
                        : 'Toggle to mark this cashback as settled'}
                    </p>
                  </div>
                  <Checkbox
                    id="isPaid-toggle"
                    checked={selected.isPaid}
                    onCheckedChange={(checked) => onTogglePaid(selected.id, !!checked)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
