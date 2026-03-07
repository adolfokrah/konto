'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Phone,
  Calendar,
  User,
  Container,
  Receipt,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSWRMutation from 'swr/mutation'
import { type RefundRow } from './data-table/columns/refund-columns'

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

const statusStyles: Record<string, string> = {
  pending: 'border-yellow-700 bg-yellow-900/40 text-yellow-300',
  'in-progress': 'border-blue-700 bg-blue-900/40 text-blue-300',
  completed: 'border-green-700 bg-green-900/40 text-green-300',
  failed: 'border-red-700 bg-red-900/40 text-red-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Awaiting Approval',
  'in-progress': 'In Progress',
  completed: 'Completed',
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

export function RefundDetailSheet({
  selected,
  onClose,
}: {
  selected: RefundRow | null
  onClose: () => void
}) {
  const router = useRouter()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const { trigger: triggerApprove, isMutating: approving } = useSWRMutation(
    '/api/refunds/approve-refund',
    async (url: string, { arg }: { arg: { refundId: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to approve refund')
      return data
    },
  )

  const { trigger: triggerReject, isMutating: rejecting } = useSWRMutation(
    '/api/refunds/reject-refund',
    async (url: string, { arg }: { arg: { refundId: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to reject refund')
      return data
    },
  )

  const canApprove = selected?.status === 'pending'
  const isActioning = approving || rejecting

  const handleApprove = async () => {
    if (!selected || !canApprove) return

    try {
      await triggerApprove({ refundId: selected.id })
      toast.success('Refund approved and processing started')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve refund')
    }
  }

  const handleReject = async () => {
    if (!selected || !canApprove) return

    try {
      await triggerReject({ refundId: selected.id })
      toast.success('Refund rejected')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject refund')
    }
  }

  const currency = selected?.jar?.currency || 'GHS'

  return (
    <>
      <Sheet open={!!selected} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">Refund Details</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selected.id}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status Banner */}
                <div className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  statusStyles[selected.status],
                )}>
                  <div>
                    <p className="text-sm font-medium">{statusLabels[selected.status] || selected.status}</p>
                    <p className="text-xs opacity-70">{formatFullDate(selected.createdAt)}</p>
                  </div>
                  <span className="ml-auto text-lg font-semibold">
                    {formatAmount(Math.abs(selected.amount), currency)}
                  </span>
                </div>

                {/* Overview */}
                <div>
                  <h4 className="text-sm font-semibold mb-1">Overview</h4>
                  <Separator className="mb-2" />
                  <DetailRow
                    label="Contributor"
                    value={selected.accountName || '\u2014'}
                    icon={<User className="h-3.5 w-3.5" />}
                  />
                  <DetailRow
                    label="Phone"
                    value={selected.accountNumber}
                    icon={<Phone className="h-3.5 w-3.5" />}
                  />
                  <DetailRow
                    label="Provider"
                    value={selected.mobileMoneyProvider}
                  />
                  <DetailRow
                    label="Jar"
                    value={selected.jar ? (
                      <Link href={`/dashboard/jars/${selected.jar.id}`} className="hover:underline">
                        {selected.jar.name}
                      </Link>
                    ) : null}
                    icon={<Container className="h-3.5 w-3.5" />}
                  />
                  <DetailRow
                    label="Linked Transaction"
                    value={selected.linkedTransaction ? (
                      <span className="font-mono text-xs">{selected.linkedTransaction.id}</span>
                    ) : null}
                  />
                  <DetailRow
                    label="Date"
                    value={formatFullDate(selected.createdAt)}
                    icon={<Calendar className="h-3.5 w-3.5" />}
                  />
                </div>

                {/* Fees */}
                {(selected.eganowFees > 0 || selected.hogapayRevenue > 0) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Fees</h4>
                    <Separator className="mb-2" />
                    <DetailRow
                      label="Eganow Fees"
                      value={formatAmount(Math.abs(selected.eganowFees), currency)}
                    />
                    <DetailRow
                      label="Hogapay Revenue"
                      value={
                        <span className="text-green-700 font-semibold">
                          {formatAmount(Math.abs(selected.hogapayRevenue), currency)}
                        </span>
                      }
                      icon={<Receipt className="h-3.5 w-3.5" />}
                    />
                  </div>
                )}

                {/* Initiated By */}
                {selected.initiatedBy && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Initiated By</h4>
                    <Separator className="mb-2" />
                    <DetailRow
                      label="Name"
                      value={`${selected.initiatedBy.firstName || ''} ${selected.initiatedBy.lastName || ''}`.trim() || '\u2014'}
                      icon={<User className="h-3.5 w-3.5" />}
                    />
                    <DetailRow label="Email" value={selected.initiatedBy.email} />
                  </div>
                )}

                {/* Reference */}
                {selected.transactionReference && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Reference</h4>
                    <Separator className="mb-2" />
                    <DetailRow
                      label="Eganow Ref"
                      value={<span className="font-mono text-xs">{selected.transactionReference}</span>}
                    />
                  </div>
                )}

                {/* Approve / Reject Actions */}
                {canApprove && (
                  <div>
                    <Separator className="mb-4" />
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        disabled={isActioning}
                        onClick={() => setShowRejectDialog(true)}
                      >
                        {rejecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        {rejecting ? 'Rejecting...' : 'Reject'}
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={isActioning}
                        onClick={() => setShowApproveDialog(true)}
                      >
                        {approving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {approving ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this refund of{' '}
              <span className="font-semibold">
                {selected ? formatAmount(Math.abs(selected.amount), currency) : ''}
              </span>{' '}
              to {selected?.accountName || 'the contributor'}? This will initiate the payout via Eganow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approve Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this refund of{' '}
              <span className="font-semibold">
                {selected ? formatAmount(Math.abs(selected.amount), currency) : ''}
              </span>{' '}
              for {selected?.accountName || 'the contributor'}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
