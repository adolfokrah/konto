'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/utilities/ui'
import {
  typeStyles,
  statusStyles,
  paymentMethodLabels,
} from '@/components/dashboard/table-constants'
import {
  Phone,
  CreditCard,
  Calendar,
  User,
  Link2,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Container,
} from 'lucide-react'
import { type TransactionRow } from './data-table/columns/transaction-columns'

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

function formatAmount(amount: number) {
  return `GHS ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  pending: <Clock className="h-4 w-4 text-yellow-400" />,
  failed: <XCircle className="h-4 w-4 text-red-400" />,
}

const statusDisplayLabels: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
}

function DetailRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value && value !== 0) return null
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

export function TransactionDetailSheet({
  selected,
  onClose,
}: {
  selected: TransactionRow | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {selected && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base">Transaction Details</SheetTitle>
                <Badge variant="outline" className={cn('capitalize', typeStyles[selected.type])}>
                  {selected.type}
                </Badge>
              </div>
              <SheetDescription className="font-mono text-xs">
                {selected.id}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Status Banner */}
              <div className={cn(
                'flex items-center gap-3 rounded-lg border p-3',
                selected.paymentStatus === 'completed' && 'border-green-700 bg-green-900/40 text-green-300',
                selected.paymentStatus === 'pending' && 'border-yellow-700 bg-yellow-900/40 text-yellow-300',
                selected.paymentStatus === 'failed' && 'border-red-700 bg-red-900/40 text-red-300',
              )}>
                {statusIcons[selected.paymentStatus]}
                <div>
                  <p className="text-sm font-medium">{statusDisplayLabels[selected.paymentStatus] || selected.paymentStatus}</p>
                  <p className="text-xs opacity-70">{formatFullDate(selected.createdAt)}</p>
                </div>
                <span className="ml-auto text-lg font-semibold">
                  {formatAmount(selected.amountContributed)}
                </span>
              </div>

              {/* Overview */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Overview</h4>
                <Separator className="mb-2" />
                <DetailRow
                  label="Contributor"
                  value={selected.contributor || '—'}
                  icon={<User className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Phone"
                  value={selected.contributorPhoneNumber}
                  icon={<Phone className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Jar"
                  value={selected.jar?.name}
                  icon={<Container className="h-3.5 w-3.5" />}
                />
                <DetailRow
                  label="Payment Method"
                  value={selected.paymentMethod ? paymentMethodLabels[selected.paymentMethod] || selected.paymentMethod : null}
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                />
                <DetailRow label="Provider" value={selected.paymentMethod === 'mobile-money' ? (selected.mobileMoneyProvider || '—') : '—'} />
                {selected.accountNumber && (
                  <DetailRow label="Account Number" value={selected.accountNumber} />
                )}
                <DetailRow
                  label="Date"
                  value={formatFullDate(selected.createdAt)}
                  icon={<Calendar className="h-3.5 w-3.5" />}
                />
                {selected.viaPaymentLink && (
                  <DetailRow
                    label="Via Payment Link"
                    value={<Badge variant="outline" className="bg-indigo-900/40 text-indigo-300 border-indigo-700">Yes</Badge>}
                    icon={<Link2 className="h-3.5 w-3.5" />}
                  />
                )}
              </div>

              {/* Charges Breakdown */}
              {selected.chargesBreakdown && (() => {
                const cb = selected.chargesBreakdown
                const isPayout = selected.type === 'payout'
                const abs = (v: number | null) => v != null ? Math.abs(v) : null
                return (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Charges Breakdown</h4>
                    <Separator className="mb-2" />
                    {!isPayout && (
                      <DetailRow
                        label="Platform Charge"
                        value={cb.platformCharge != null ? formatAmount(Math.abs(cb.platformCharge)) : null}
                      />
                    )}
                    {!isPayout && (
                      <DetailRow
                        label="Amount Paid by Contributor"
                        value={cb.amountPaidByContributor != null ? formatAmount(Math.abs(cb.amountPaidByContributor)) : null}
                      />
                    )}
                    <DetailRow
                      label="Eganow Fees"
                      value={abs(cb.eganowFees) != null ? formatAmount(abs(cb.eganowFees)!) : null}
                    />
                    <DetailRow
                      label="Hogapay Revenue"
                      value={abs(cb.hogapayRevenue) != null ? (
                        <span className="text-green-700 font-semibold">{formatAmount(abs(cb.hogapayRevenue)!)}</span>
                      ) : null}
                      icon={<Receipt className="h-3.5 w-3.5" />}
                    />
                  </div>
                )
              })()}

              {/* Payout Details */}
              {selected.type === 'payout' && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Payout Details</h4>
                  <Separator className="mb-2" />
                  <DetailRow
                    label="Fee Percentage"
                    value={selected.payoutFeePercentage != null ? `${selected.payoutFeePercentage}%` : null}
                  />
                  <DetailRow
                    label="Fee Amount"
                    value={selected.payoutFeeAmount != null ? formatAmount(selected.payoutFeeAmount) : null}
                  />
                  <DetailRow
                    label="Net Amount"
                    value={selected.payoutNetAmount != null ? (
                      <span className="font-semibold">{formatAmount(selected.payoutNetAmount)}</span>
                    ) : null}
                  />
                </div>
              )}

              {/* Settlement & Reference */}
              <div>
                <h4 className="text-sm font-semibold mb-1">Settlement</h4>
                <Separator className="mb-2" />
                <DetailRow
                  label="Settled"
                  value={
                    <Badge variant="outline" className={selected.isSettled ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-gray-800/40 text-gray-400 border-gray-700'}>
                      {selected.isSettled ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
                {selected.transactionReference && (
                  <DetailRow
                    label="Reference"
                    value={<span className="font-mono text-xs">{selected.transactionReference}</span>}
                  />
                )}
              </div>

              {/* Collector */}
              {selected.collector && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Collector</h4>
                  <Separator className="mb-2" />
                  <DetailRow
                    label="Name"
                    value={`${selected.collector.firstName || ''} ${selected.collector.lastName || ''}`.trim() || '—'}
                    icon={<User className="h-3.5 w-3.5" />}
                  />
                  <DetailRow label="Email" value={selected.collector.email} />
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
