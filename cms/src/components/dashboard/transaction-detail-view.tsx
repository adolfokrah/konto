'use client'

import { useState } from 'react'
import { useIsAdmin } from './dashboard-user-context'
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
import { cn } from '@/utilities/ui'
import { paymentMethodLabels, networkFor } from '@/components/dashboard/table-constants'
import { DetailCard, DetailList } from '@/components/dashboard/detail-kit'
import { CreditCard, Loader2, ShieldAlert, Banknote, Copy, Check } from 'lucide-react'
import { ImageDropZone } from '@/components/ui/image-drop-zone'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import useSWR from 'swr'
import { type TransactionRow } from './data-table/columns/transaction-columns'

function formatAmount(amount: number) {
  return `GHS ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const disputeVariant: Record<string, 'info' | 'warn' | 'pos' | 'neg'> = {
  open: 'info',
  'under-review': 'warn',
  resolved: 'pos',
  rejected: 'neg',
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 justify-end cursor-pointer text-left hover:opacity-80 transition-opacity"
    >
      <span className="font-mono text-xs break-all">{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-400 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
    </button>
  )
}

export function TransactionDetailView({ transaction }: { transaction: TransactionRow }) {
  const router = useRouter()
  const isAdmin = useIsAdmin()
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeFiles, setDisputeFiles] = useState<File[]>([])
  const [submittingDispute, setSubmittingDispute] = useState(false)

  const { data: referralBonus } = useSWR<any>(
    transaction.type === 'payout' || transaction.type === 'contribution'
      ? `/api/referral-bonuses?where[transaction][equals]=${transaction.id}&depth=1&limit=1`
      : null,
    async (url: string) => {
      const res = await fetch(url)
      const data = await res.json()
      return data.docs?.[0] || null
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

  const handleDisputeSubmit = async () => {
    if (!disputeDescription.trim()) return
    setSubmittingDispute(true)
    try {
      const mediaIds: string[] = []
      for (const file of disputeFiles) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/media', {
          method: 'POST',
          body: form,
          credentials: 'include',
        })
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

  const isPayout = transaction.type === 'payout'
  const network =
    transaction.paymentMethod === 'mobile-money'
      ? networkFor(transaction.mobileMoneyProvider)
      : undefined
  const methodLabel = transaction.paymentMethod
    ? (network?.label ??
      paymentMethodLabels[transaction.paymentMethod] ??
      transaction.paymentMethod)
    : null
  const cb = transaction.chargesBreakdown
  const abs = (v: number | null | undefined) => (v != null ? Math.abs(v) : null)
  const money = (v: number | null | undefined) =>
    v != null ? Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null
  const collectorName = transaction.collector
    ? `${transaction.collector.firstName || ''} ${transaction.collector.lastName || ''}`.trim() ||
      transaction.collector.email
    : null
  const shortDate = new Date(transaction.createdAt).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const webhookStatus =
    transaction.webhookResponse && typeof transaction.webhookResponse === 'object'
      ? ((transaction.webhookResponse as any).status ??
        (transaction.webhookResponse as any).statusCode ??
        null)
      : null

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {network ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={network.logo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card">
                {isPayout ? <Banknote className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-chillax text-[30px] font-semibold leading-[1.1] tracking-tight">
                  {isPayout ? '−' : ''}
                  {formatAmount(transaction.amountContributed)}
                </h1>
                <Badge variant={isPayout ? 'info' : 'brand'} className="capitalize">
                  {transaction.type}
                </Badge>
                <Badge
                  variant={
                    transaction.paymentStatus === 'completed'
                      ? 'pos'
                      : transaction.paymentStatus === 'failed'
                        ? 'neg'
                        : 'warn'
                  }
                  className="capitalize"
                >
                  {transaction.paymentStatus.replace('-', ' ')}
                </Badge>
              </div>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                {shortDate}
                {transaction.contributor && <> · {transaction.contributor}</>}
                {transaction.jar && (
                  <>
                    {' '}
                    →{' '}
                    <Link
                      href={`/dashboard/jars/${transaction.jar.id}`}
                      className="hover:underline"
                    >
                      {transaction.jar.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowDisputeDialog(true)}>
              <ShieldAlert className="h-4 w-4" />
              Raise dispute
            </Button>
          )}
        </div>

        {/* Three cards */}
        <div className="grid gap-3 lg:grid-cols-3">
          <DetailCard title="Overview">
            <DetailList
              labelWidth={110}
              rows={[
                ['Contributor', transaction.contributor || '—'],
                ['Phone', transaction.contributorPhoneNumber],
                [
                  'Collector',
                  collectorName && transaction.collector ? (
                    <Link
                      href={`/dashboard/users/${transaction.collector.id}`}
                      className="hover:underline"
                    >
                      {collectorName}
                      {transaction.viaPaymentLink && ' · via link'}
                    </Link>
                  ) : transaction.viaPaymentLink ? (
                    'Via payment link'
                  ) : null,
                ],
                [
                  'Jar',
                  transaction.jar ? (
                    <Link
                      href={`/dashboard/jars/${transaction.jar.id}`}
                      className="hover:underline"
                    >
                      {transaction.jar.name}
                    </Link>
                  ) : null,
                ],
                ['Method', methodLabel],
                ['Account', transaction.accountNumber],
              ]}
            />
          </DetailCard>

          <DetailCard title="Charges breakdown">
            {cb ? (
              <DetailList
                labelWidth={130}
                rows={[
                  [isPayout ? 'Amount' : 'Contribution', money(transaction.amountContributed)],
                  ['Paid by contributor', !isPayout ? money(cb.amountPaidByContributor) : null],
                  ['Platform charge', !isPayout ? money(cb.platformCharge) : null],
                  ['Eganow fees', money(cb.eganowFees)],
                  [
                    'Hogapay revenue',
                    abs(cb.hogapayRevenue) != null ? (
                      <span className="text-[#0F9F61]">{money(cb.hogapayRevenue)}</span>
                    ) : null,
                  ],
                ]}
              />
            ) : (
              <p className="text-[12.5px] text-muted-foreground">No charges recorded.</p>
            )}
          </DetailCard>

          {isPayout ? (
            <DetailCard title="Payout & reference">
              <DetailList
                labelWidth={110}
                rows={[
                  [
                    'Fee',
                    transaction.payoutFeePercentage != null
                      ? `${transaction.payoutFeePercentage}% · ${money(transaction.payoutFeeAmount) ?? '0.00'}`
                      : null,
                  ],
                  [
                    'Net amount',
                    transaction.payoutNetAmount != null
                      ? formatAmount(transaction.payoutNetAmount)
                      : null,
                  ],
                  [
                    'Reference',
                    transaction.transactionReference ? (
                      <CopyableText text={transaction.transactionReference} />
                    ) : null,
                  ],
                  ['ID', <CopyableText key="id" text={transaction.id} />],
                ]}
              />
            </DetailCard>
          ) : (
            <DetailCard title="Settlement & reference">
              <DetailList
                labelWidth={100}
                rows={[
                  [
                    'Settled',
                    transaction.paymentMethod === 'mobile-money'
                      ? transaction.isSettled
                        ? 'Yes'
                        : 'No'
                      : null,
                  ],
                  [
                    'Reference',
                    transaction.transactionReference ? (
                      <CopyableText text={transaction.transactionReference} />
                    ) : null,
                  ],
                  ['ID', <CopyableText key="id" text={transaction.id} />],
                  [
                    'Webhook',
                    webhookStatus != null ? (
                      <Badge variant={String(webhookStatus).startsWith('2') ? 'pos' : 'gray'}>
                        {String(webhookStatus)}
                      </Badge>
                    ) : transaction.webhookResponse ? (
                      <Badge variant="pos">Received</Badge>
                    ) : null,
                  ],
                ]}
              />
            </DetailCard>
          )}
        </div>

        {/* Message & answers */}
        {(transaction.remarks ||
          (transaction.customFieldValues && transaction.customFieldValues.length > 0)) && (
          <DetailCard title="Message & answers">
            {transaction.remarks && (
              <p className="whitespace-pre-wrap text-[13.5px]">
                &ldquo;{transaction.remarks}&rdquo;
              </p>
            )}
            {transaction.customFieldValues && transaction.customFieldValues.length > 0 && (
              <div className={cn(transaction.remarks && 'mt-3')}>
                <DetailList
                  labelWidth={200}
                  rows={transaction.customFieldValues.map((field) => [
                    field.label,
                    typeof field.value === 'boolean'
                      ? field.value
                        ? 'Yes'
                        : 'No'
                      : String(field.value),
                  ])}
                />
              </div>
            )}
          </DetailCard>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Disputes */}
          <DetailCard
            title={
              <>
                Disputes
                {relatedDisputes && relatedDisputes.length > 0 && (
                  <span className="ml-1.5 text-muted-foreground">{relatedDisputes.length}</span>
                )}
              </>
            }
          >
            {relatedDisputes && relatedDisputes.length > 0 ? (
              <div className="space-y-2">
                {relatedDisputes.map((dispute: any) => (
                  <Link
                    key={dispute.id}
                    href={`/dashboard/disputes/${dispute.id}`}
                    className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3 transition-colors hover:bg-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-medium">{dispute.description}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        {new Date(dispute.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={disputeVariant[dispute.status] ?? 'gray'}
                      className="capitalize"
                    >
                      {String(dispute.status).replace('-', ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-muted-foreground">No disputes on this payment.</p>
            )}
          </DetailCard>

          {/* Referral bonus */}
          <DetailCard title="Referral bonus">
            {referralBonus ? (
              <DetailList
                labelWidth={100}
                rows={[
                  [
                    'Type',
                    referralBonus.bonusType === 'first_contribution'
                      ? 'First contribution'
                      : 'Fee share',
                  ],
                  [
                    'Referrer',
                    referralBonus.user ? (
                      <Link
                        href={`/dashboard/users/${typeof referralBonus.user === 'object' ? referralBonus.user.id : referralBonus.user}`}
                        className="hover:underline"
                      >
                        {typeof referralBonus.user === 'object'
                          ? `${referralBonus.user.firstName || ''} ${referralBonus.user.lastName || ''}`.trim() ||
                            referralBonus.user.email
                          : referralBonus.user}
                      </Link>
                    ) : null,
                  ],
                  [
                    'Amount',
                    <span key="amt" className="text-[#0F9F61]">
                      +{formatAmount(referralBonus.amount)}
                    </span>,
                  ],
                  [
                    'Status',
                    <Badge
                      key="st"
                      variant={
                        referralBonus.status === 'paid'
                          ? 'pos'
                          : referralBonus.status === 'pending'
                            ? 'warn'
                            : 'neg'
                      }
                      className="capitalize"
                    >
                      {referralBonus.status}
                    </Badge>,
                  ],
                ]}
              />
            ) : (
              <p className="text-[12.5px] text-muted-foreground">No referral bonus.</p>
            )}
          </DetailCard>
        </div>

        {transaction.webhookResponse && (
          <DetailCard>
            <details>
              <summary className="cursor-pointer font-chillax text-[15px] font-semibold">
                Webhook response
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-secondary/60 p-3 text-[11.5px] text-muted-foreground">
                {JSON.stringify(transaction.webhookResponse, null, 2)}
              </pre>
            </details>
          </DetailCard>
        )}
      </div>

      {/* Dispute Dialog */}
      <Dialog
        open={showDisputeDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDisputeDialog(false)
            setDisputeDescription('')
            setDisputeFiles([])
          }
        }}
      >
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
            <Button variant="ghost" onClick={() => setShowDisputeDialog(false)}>
              Cancel
            </Button>
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
    </>
  )
}
