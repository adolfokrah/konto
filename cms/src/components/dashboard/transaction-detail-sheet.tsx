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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  RotateCcw,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { ImageDropZone } from '@/components/ui/image-drop-zone'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
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

const approvalStatusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

const approvalStatusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const refundStatusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
}

const refundStatusLabels: Record<string, string> = {
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

export function TransactionDetailSheet({
  selected,
  onClose,
}: {
  selected: TransactionRow | null
  onClose: () => void
}) {
  const router = useRouter()
  const [refunded, setRefunded] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeFiles, setDisputeFiles] = useState<File[]>([])
  const [submittingDispute, setSubmittingDispute] = useState(false)
  // Fetch referral bonus linked to this transaction (first_contribution for contributions, fee_share for payouts)
  const { data: referralBonus } = useSWR<any>(
    (selected?.type === 'payout' || selected?.type === 'contribution') ? `/api/referral-bonuses?where[transaction][equals]=${selected.id}&depth=1&limit=1` : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs?.[0] || null
    },
  )

  // Fetch payout approvals for payout transactions
  const { data: payoutApprovals } = useSWR<any[]>(
    selected?.type === 'payout' ? `/api/payout-approvals?where[linkedTransaction][equals]=${selected.id}&depth=1&sort=-createdAt` : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs || []
    },
  )

  // Fetch related refunds from the refunds collection
  const { data: relatedRefunds } = useSWR<any[]>(
    selected?.type === 'contribution' ? `/api/refunds?where[linkedTransaction][equals]=${selected.id}&depth=1` : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs || []
    },
  )

  const { trigger: triggerRefund, isMutating: refunding } = useSWRMutation(
    '/api/transactions/refund-contribution',
    async (url: string, { arg }: { arg: { transactionId: string } }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Failed to initiate refund')
      return data
    },
  )

  const handleDisputeSubmit = async () => {
    if (!selected || !disputeDescription.trim()) return
    setSubmittingDispute(true)
    try {
      // Upload evidence images first
      const mediaIds: string[] = []
      for (const file of disputeFiles) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' })
        const data = await res.json()
        if (data.doc?.id) mediaIds.push(data.doc.id)
      }

      await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transaction: selected.id,
          description: disputeDescription.trim(),
          evidence: mediaIds.map((id) => ({ image: id })),
        }),
      })

      toast.success('Dispute submitted successfully')
      setShowDisputeDialog(false)
      setDisputeDescription('')
      setDisputeFiles([])
      router.refresh()
    } catch {
      toast.error('Failed to submit dispute')
    } finally {
      setSubmittingDispute(false)
    }
  }

  const hasActiveRefund = relatedRefunds?.some(
    (r: any) => r.status === 'pending' || r.status === 'in-progress' || r.status === 'completed',
  )

  const canRefund =
    selected?.type === 'contribution' &&
    selected?.paymentStatus === 'completed' &&
    selected?.paymentMethod === 'mobile-money' &&
    !selected?.isSettled &&
    !refunded &&
    !hasActiveRefund

  const handleRefund = async () => {
    if (!selected || !canRefund) return

    try {
      await triggerRefund({ transactionId: selected.id })
      toast.success('Refund requested successfully')
      setRefunded(true)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate refund')
    }
  }

  return (
    <>
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
                  value={selected.jar ? (
                    <Link href={`/dashboard/jars/${selected.jar.id}`} className="hover:underline">
                      {selected.jar.name}
                    </Link>
                  ) : null}
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

              {/* Referral Bonus */}
              {referralBonus && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">
                    {referralBonus.bonusType === 'first_contribution' ? 'Referral First Contribution Bonus' : 'Referral Fee Share'}
                  </h4>
                  <Separator className="mb-2" />
                  <DetailRow
                    label="Bonus Type"
                    value={referralBonus.bonusType === 'first_contribution' ? 'First Contribution' : 'Fee Share'}
                  />
                  <DetailRow
                    label="Referrer"
                    value={
                      referralBonus.user ? (
                        <Link
                          href={`/dashboard/users/${typeof referralBonus.user === 'object' ? referralBonus.user.id : referralBonus.user}`}
                          className="hover:underline"
                        >
                          {typeof referralBonus.user === 'object'
                            ? `${referralBonus.user.firstName || ''} ${referralBonus.user.lastName || ''}`.trim() || referralBonus.user.email
                            : referralBonus.user}
                        </Link>
                      ) : null
                    }
                    icon={<User className="h-3.5 w-3.5" />}
                  />
                  <DetailRow
                    label="Fee Shared"
                    value={
                      <span className="text-green-400 font-semibold">
                        +{formatAmount(referralBonus.amount)}
                      </span>
                    }
                    icon={<Receipt className="h-3.5 w-3.5" />}
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          referralBonus.status === 'paid' && 'bg-green-900/40 text-green-300 border-green-700',
                          referralBonus.status === 'pending' && 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
                          referralBonus.status === 'cancelled' && 'bg-red-900/40 text-red-300 border-red-700',
                        )}
                      >
                        {referralBonus.status}
                      </Badge>
                    }
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
                    value={
                      <Link href={`/dashboard/users/${selected.collector.id}`} className="hover:underline">
                        {`${selected.collector.firstName || ''} ${selected.collector.lastName || ''}`.trim() || '—'}
                      </Link>
                    }
                    icon={<User className="h-3.5 w-3.5" />}
                  />
                  <DetailRow label="Email" value={selected.collector.email} />
                </div>
              )}

              {/* Related Refunds */}
              {relatedRefunds && relatedRefunds.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Refunds</h4>
                  <Separator className="mb-2" />
                  <div className="space-y-2">
                    {relatedRefunds.map((refund: any) => (
                      <div key={refund.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-3.5 w-3.5 text-orange-400" />
                          <div>
                            <p className="text-sm font-medium">{formatAmount(refund.amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatFullDate(refund.createdAt)}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('capitalize', refundStatusStyles[refund.status] || '')}>
                          {refundStatusLabels[refund.status] || refund.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Approvals */}
              {payoutApprovals && payoutApprovals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Approvals</h4>
                  <Separator className="mb-2" />
                  <div className="space-y-2">
                    {payoutApprovals.map((approval: any) => {
                      const requestedBy = typeof approval.requestedBy === 'object' && approval.requestedBy
                        ? `${approval.requestedBy.firstName || ''} ${approval.requestedBy.lastName || ''}`.trim() || approval.requestedBy.email || '—'
                        : '—'
                      const actionBy = typeof approval.actionBy === 'object' && approval.actionBy
                        ? `${approval.actionBy.firstName || ''} ${approval.actionBy.lastName || ''}`.trim() || approval.actionBy.email || null
                        : null
                      return (
                        <div key={approval.id} className="rounded-lg border p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{formatFullDate(approval.createdAt)}</span>
                            <Badge variant="outline" className={cn('capitalize', approvalStatusStyles[approval.status] || '')}>
                              {approvalStatusLabels[approval.status] || approval.status}
                            </Badge>
                          </div>
                          <DetailRow label={actionBy ? 'Action By' : 'Requested By'} value={actionBy || requestedBy} icon={<User className="h-3.5 w-3.5" />} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Refund Action */}
              {canRefund && (
                <div>
                  <Separator className="mb-4" />
                  <Button
                    variant="destructive"
                    className="w-full"
                    disabled={refunding}
                    onClick={() => setShowRefundDialog(true)}
                  >
                    {refunding ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    {refunding ? 'Requesting Refund...' : 'Request Refund'}
                  </Button>
                </div>
              )}

              {/* Flag Dispute */}
              <div>
                <Separator className="mb-4" />
                <Button
                  variant="outline"
                  className="w-full border-orange-700 text-orange-400 hover:bg-orange-900/20 hover:text-orange-300"
                  onClick={() => setShowDisputeDialog(true)}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Flag as Dispute
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>

    <Dialog open={showDisputeDialog} onOpenChange={(open) => { if (!open) { setShowDisputeDialog(false); setDisputeDescription(''); setDisputeFiles([]) } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-400" />
            Flag as Dispute
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Description</label>
            <Textarea
              placeholder="Describe the issue with this transaction..."
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Evidence (optional)</label>
            <ImageDropZone value={disputeFiles} onChange={setDisputeFiles} maxFiles={5} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
          <Button
            disabled={!disputeDescription.trim() || submittingDispute}
            onClick={handleDisputeSubmit}
          >
            {submittingDispute ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to refund{' '}
            <span className="font-semibold">{selected ? formatAmount(selected.amountContributed) : ''}</span>{' '}
            to {selected?.contributor || 'the contributor'}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefund}>
            Confirm Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
