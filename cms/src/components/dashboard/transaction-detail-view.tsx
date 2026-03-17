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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/utilities/ui'
import { typeStyles, paymentMethodLabels } from '@/components/dashboard/table-constants'
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
  Banknote,
  Copy,
  Check,
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
  return `GHS ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const refundStatusStyles: Record<string, string> = {
  pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  'in-progress': 'bg-blue-900/40 text-blue-300 border-blue-700',
  completed: 'bg-green-900/40 text-green-300 border-green-700',
  failed: 'bg-red-900/40 text-red-300 border-red-700',
}

const refundStatusLabels: Record<string, string> = {
  pending: 'Awaiting Approval',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
}

const disputeStatusStyles: Record<string, string> = {
  open: 'bg-blue-900/40 text-blue-300 border-blue-700',
  'under-review': 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  resolved: 'bg-green-900/40 text-green-300 border-green-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); toast.success('Copied to clipboard'); setTimeout(() => setCopied(false), 1500) }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 justify-end cursor-pointer text-left hover:opacity-80 transition-opacity"
    >
      <span className="font-mono text-xs break-all">{text}</span>
      {copied ? <Check className="h-3 w-3 text-green-400 shrink-0" /> : <Copy className="h-3 w-3 text-muted-foreground shrink-0" />}
    </button>
  )
}

function Row({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border/50">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        </div>
        <div className="px-4">{children}</div>
      </CardContent>
    </Card>
  )
}

export function TransactionDetailView({ transaction }: { transaction: TransactionRow }) {
  const router = useRouter()
  const [refunded, setRefunded] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeFiles, setDisputeFiles] = useState<File[]>([])
  const [submittingDispute, setSubmittingDispute] = useState(false)

  const { data: referralBonus } = useSWR<any>(
    (transaction.type === 'payout' || transaction.type === 'contribution')
      ? `/api/referral-bonuses?where[transaction][equals]=${transaction.id}&depth=1&limit=1`
      : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs?.[0] || null
    },
  )

  const { data: relatedRefunds } = useSWR<any[]>(
    transaction.type === 'contribution'
      ? `/api/refunds?where[linkedTransaction][equals]=${transaction.id}&depth=1`
      : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs || []
    },
  )

  const { data: relatedDisputes, mutate: mutateDisputes } = useSWR<any[]>(
    `/api/disputes?where[transaction][equals]=${transaction.id}&depth=1`,
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
    if (!disputeDescription.trim()) return
    setSubmittingDispute(true)
    try {
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
          transaction: transaction.id,
          description: disputeDescription.trim(),
          evidence: mediaIds.map((id) => ({ image: id })),
        }),
      })
      toast.success('Dispute submitted successfully')
      setShowDisputeDialog(false)
      setDisputeDescription('')
      setDisputeFiles([])
      mutateDisputes()
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
    transaction.type === 'contribution' &&
    transaction.paymentStatus === 'completed' &&
    transaction.paymentMethod === 'mobile-money' &&
    !transaction.isSettled &&
    !refunded &&
    !hasActiveRefund

  const handleRefund = async () => {
    if (!canRefund) return
    try {
      await triggerRefund({ transactionId: transaction.id })
      toast.success('Refund requested successfully')
      setRefunded(true)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate refund')
    }
  }

  const isCompleted = transaction.paymentStatus === 'completed'
  const isPending = transaction.paymentStatus === 'pending'

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Left panel ── */}
        <div className="space-y-4">
          {/* Hero card */}
          <Card className={cn(
            'border',
            isCompleted && 'border-green-800/60 bg-green-950/20',
            isPending && 'border-yellow-800/60 bg-yellow-950/20',
            !isCompleted && !isPending && 'border-red-800/60 bg-red-950/20',
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                    {isPending && <Clock className="h-5 w-5 text-yellow-400" />}
                    {!isCompleted && !isPending && <XCircle className="h-5 w-5 text-red-400" />}
                    <span className={cn(
                      'text-sm font-semibold',
                      isCompleted && 'text-green-400',
                      isPending && 'text-yellow-400',
                      !isCompleted && !isPending && 'text-red-400',
                    )}>
                      {isCompleted ? 'Successful' : isPending ? 'Pending' : 'Failed'}
                    </span>
                    <Badge variant="outline" className={cn('capitalize ml-1', typeStyles[transaction.type])}>
                      {transaction.type}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {transaction.type === 'payout' ? '−' : '+'}{formatAmount(transaction.amountContributed)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{transaction.id}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-0.5">
                    {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview */}
          <Section title="Overview">
            <Row label="Transaction ID" value={<CopyableText text={transaction.id} />} />
            <Row label="Contributor" value={transaction.contributor || '—'} icon={<User className="h-3.5 w-3.5" />} />
            <Row label="Phone" value={transaction.contributorPhoneNumber} icon={<Phone className="h-3.5 w-3.5" />} />
            <Row
              label="Jar"
              value={transaction.jar ? (
                <Link href={`/dashboard/jars/${transaction.jar.id}`} className="hover:underline text-primary">
                  {transaction.jar.name}
                </Link>
              ) : null}
              icon={<Container className="h-3.5 w-3.5" />}
            />
            <Row
              label="Payment Method"
              value={transaction.paymentMethod ? paymentMethodLabels[transaction.paymentMethod] || transaction.paymentMethod : null}
              icon={<CreditCard className="h-3.5 w-3.5" />}
            />
            {transaction.paymentMethod === 'mobile-money' && (
              <Row label="Provider" value={transaction.mobileMoneyProvider ? <span className="capitalize">{transaction.mobileMoneyProvider}</span> : '—'} icon={<Phone className="h-3.5 w-3.5" />} />
            )}
            {transaction.accountNumber && <Row label="Account Number" value={transaction.accountNumber} />}
            <Row label="Date" value={formatFullDate(transaction.createdAt)} icon={<Calendar className="h-3.5 w-3.5" />} />
            {transaction.viaPaymentLink && (
              <Row
                label="Via Payment Link"
                value={<Badge variant="outline" className="bg-indigo-900/40 text-indigo-300 border-indigo-700">Yes</Badge>}
                icon={<Link2 className="h-3.5 w-3.5" />}
              />
            )}
          </Section>

          {/* Charges Breakdown */}
          {transaction.chargesBreakdown && (() => {
            const cb = transaction.chargesBreakdown
            const isPayout = transaction.type === 'payout'
            const abs = (v: number | null) => v != null ? Math.abs(v) : null
            return (
              <Section title="Charges Breakdown">
                {!isPayout && <Row label="Amount Paid by Contributor" value={cb.amountPaidByContributor != null ? formatAmount(cb.amountPaidByContributor) : null} />}
                {!isPayout && <Row label="Platform Charge" value={cb.platformCharge != null ? formatAmount(cb.platformCharge) : null} />}
                <Row label="Eganow Fees" value={abs(cb.eganowFees) != null ? formatAmount(abs(cb.eganowFees)!) : null} />
                <Row
                  label="Hogapay Revenue"
                  value={abs(cb.hogapayRevenue) != null ? (
                    <span className="text-green-400 font-semibold">{formatAmount(abs(cb.hogapayRevenue)!)}</span>
                  ) : null}
                  icon={<Receipt className="h-3.5 w-3.5" />}
                />
              </Section>
            )
          })()}

          {/* Payout Details */}
          {transaction.type === 'payout' && (
            <Section title="Payout Details">
              <Row label="Fee Percentage" value={transaction.payoutFeePercentage != null ? `${transaction.payoutFeePercentage}%` : null} />
              <Row label="Fee Amount" value={transaction.payoutFeeAmount != null ? formatAmount(transaction.payoutFeeAmount) : null} />
              <Row
                label="Net Amount"
                value={transaction.payoutNetAmount != null ? (
                  <span className="font-semibold">{formatAmount(transaction.payoutNetAmount)}</span>
                ) : null}
                icon={<Banknote className="h-3.5 w-3.5" />}
              />
            </Section>
          )}

          {/* Settlement — only for momo contributions */}
          {transaction.type === 'contribution' && transaction.paymentMethod === 'mobile-money' && <Section title="Settlement">
            <Row
              label="Settled"
              value={
                <Badge variant="outline" className={transaction.isSettled ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-gray-800/40 text-gray-400 border-gray-700'}>
                  {transaction.isSettled ? 'Yes' : 'No'}
                </Badge>
              }
            />
          </Section>}

          {/* Reference — always visible */}
          {transaction.transactionReference && (
            <Section title="Reference">
              <Row label="Transaction Reference" value={<CopyableText text={transaction.transactionReference!} />} />
            </Section>
          )}

          {/* Webhook Response */}
          {transaction.webhookResponse && (
            <Section title="Webhook Response">
              <div className="py-3">
                <pre className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(transaction.webhookResponse, null, 2)}
                </pre>
              </div>
            </Section>
          )}

          {/* Collector */}
          {transaction.collector && (
            <Section title="Collector">
              <Row
                label="Name"
                value={
                  <Link href={`/dashboard/users/${transaction.collector.id}`} className="hover:underline text-primary">
                    {`${transaction.collector.firstName || ''} ${transaction.collector.lastName || ''}`.trim() || '—'}
                  </Link>
                }
                icon={<User className="h-3.5 w-3.5" />}
              />
              <Row label="Email" value={transaction.collector.email} />
            </Section>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="refunds">
                <TabsList className="w-full rounded-none border-b border-border/60 bg-transparent h-auto p-0">
                  <TabsTrigger
                    value="refunds"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
                  >
                    Refunds
                    {relatedRefunds && relatedRefunds.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{relatedRefunds.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="disputes"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
                  >
                    Disputes
                    {relatedDisputes && relatedDisputes.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{relatedDisputes.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="referral"
                    className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
                  >
                    Referral Bonuses
                  </TabsTrigger>
                </TabsList>

                {/* Refunds */}
                <TabsContent value="refunds" className="m-0 p-4 space-y-3">
                  {relatedRefunds && relatedRefunds.length > 0 ? (
                    relatedRefunds.map((refund: any) => (
                      <div key={refund.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-900/30 border border-orange-800/50">
                            <RotateCcw className="h-3.5 w-3.5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{formatAmount(refund.amount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(refund.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-xs', refundStatusStyles[refund.status] || '')}>
                          {refundStatusLabels[refund.status] || refund.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <RotateCcw className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No refunds</p>
                    </div>
                  )}
                  {canRefund && (
                    <Button variant="destructive" className="w-full" disabled={refunding} onClick={() => setShowRefundDialog(true)}>
                      {refunding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                      {refunding ? 'Requesting...' : 'Request Refund'}
                    </Button>
                  )}
                </TabsContent>

                {/* Disputes */}
                <TabsContent value="disputes" className="m-0 p-4 space-y-3">
                  {relatedDisputes && relatedDisputes.length > 0 ? (
                    relatedDisputes.map((dispute: any) => (
                      <Link
                        key={dispute.id}
                        href={`/dashboard/disputes?id=${dispute.id}`}
                        className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-900/30 border border-orange-800/50">
                          <ShieldAlert className="h-3.5 w-3.5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{dispute.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(dispute.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn('shrink-0 text-xs capitalize', disputeStatusStyles[dispute.status] || '')}>
                          {dispute.status}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No disputes</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-orange-800/60 text-orange-400 hover:bg-orange-900/20 hover:text-orange-300"
                    onClick={() => setShowDisputeDialog(true)}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    {relatedDisputes && relatedDisputes.length > 0 ? 'Flag Another Dispute' : 'Flag as Dispute'}
                  </Button>
                </TabsContent>

                {/* Referral */}
                <TabsContent value="referral" className="m-0 p-4">
                  {referralBonus ? (
                    <div className="space-y-0 rounded-lg border border-border/60 bg-muted/20 overflow-hidden">
                      <div className="px-4">
                        <Row label="Bonus Type" value={referralBonus.bonusType === 'first_contribution' ? 'First Contribution' : 'Fee Share'} />
                        <Row
                          label="Referrer"
                          value={
                            referralBonus.user ? (
                              <Link
                                href={`/dashboard/users/${typeof referralBonus.user === 'object' ? referralBonus.user.id : referralBonus.user}`}
                                className="hover:underline text-primary"
                              >
                                {typeof referralBonus.user === 'object'
                                  ? `${referralBonus.user.firstName || ''} ${referralBonus.user.lastName || ''}`.trim() || referralBonus.user.email
                                  : referralBonus.user}
                              </Link>
                            ) : null
                          }
                          icon={<User className="h-3.5 w-3.5" />}
                        />
                        <Row
                          label="Amount"
                          value={<span className="text-green-400 font-semibold">+{formatAmount(referralBonus.amount)}</span>}
                          icon={<Receipt className="h-3.5 w-3.5" />}
                        />
                        <Row
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
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Receipt className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No referral bonus</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dispute Dialog */}
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
              <Textarea placeholder="Describe the issue with this transaction..." value={disputeDescription} onChange={(e) => setDisputeDescription(e.target.value)} rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Evidence (optional)</label>
              <ImageDropZone value={disputeFiles} onChange={setDisputeFiles} maxFiles={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button disabled={!disputeDescription.trim() || submittingDispute} onClick={handleDisputeSubmit}>
              {submittingDispute ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Confirm */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund{' '}
              <span className="font-semibold">{formatAmount(transaction.amountContributed)}</span>{' '}
              to {transaction.contributor || 'the contributor'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>Confirm Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
