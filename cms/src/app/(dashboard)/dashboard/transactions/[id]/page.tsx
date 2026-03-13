import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { TransactionDetailView } from '@/components/dashboard/transaction-detail-view'
import { type TransactionRow } from '@/components/dashboard/data-table/columns/transaction-columns'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function TransactionDetailPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })

  const tx: any = await payload.findByID({
    collection: 'transactions',
    id,
    depth: 2,
    overrideAccess: true,
  }).catch(() => null)

  if (!tx) notFound()

  const jarObj = typeof tx.jar === 'object' && tx.jar ? tx.jar : null
  const collectorObj = typeof tx.collector === 'object' && tx.collector ? tx.collector : null

  const transaction: TransactionRow = {
    id: tx.id,
    contributor: tx.contributor || null,
    contributorPhoneNumber: tx.contributorPhoneNumber || null,
    jar: jarObj ? { id: jarObj.id, name: jarObj.name } : null,
    paymentMethod: tx.paymentMethod || null,
    mobileMoneyProvider: tx.mobileMoneyProvider || null,
    accountNumber: tx.accountNumber || null,
    amountContributed: tx.amountContributed || 0,
    chargesBreakdown: tx.chargesBreakdown || null,
    paymentStatus: tx.paymentStatus || 'pending',
    type: tx.type,
    isSettled: tx.isSettled ?? false,
    payoutFeePercentage: tx.payoutFeePercentage ?? null,
    payoutFeeAmount: tx.payoutFeeAmount ?? null,
    payoutNetAmount: tx.payoutNetAmount ?? null,
    transactionReference: tx.transactionReference || null,
    collector: collectorObj
      ? {
          id: collectorObj.id,
          firstName: collectorObj.firstName || '',
          lastName: collectorObj.lastName || '',
          email: collectorObj.email || '',
        }
      : null,
    viaPaymentLink: tx.viaPaymentLink ?? false,
    createdAt: tx.createdAt,
    webhookResponse: tx.webhookResponse ?? null,
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Transactions
      </Link>
      <TransactionDetailView transaction={transaction} />
    </div>
  )
}
