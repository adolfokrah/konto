import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Wallet, ArrowDownToLine } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/dashboard/metric-card'
import { LedgerClient } from '@/components/dashboard/ledger-client'
import { getEganow } from '@/utilities/initalise'

const DEFAULT_LIMIT = 20

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function fetchEganowBalances() {
  try {
    await getEganow().getToken()

    const [collectionBalance, payoutBalance] = await Promise.all([
      getEganow()
        .getCollectionBalance()
        .catch(() => ({ balance: null })),
      getEganow()
        .getPayoutBalance()
        .catch(() => ({ balance: null })),
    ])

    const collBal =
      collectionBalance.balance ??
      (collectionBalance as any).data?.balance ??
      (collectionBalance as any).availableBalance
    const payBal =
      payoutBalance.balance ??
      (payoutBalance as any).data?.balance ??
      (payoutBalance as any).availableBalance

    return {
      collectionBalance: typeof collBal === 'number' ? collBal : null,
      payoutBalance: typeof payBal === 'number' ? payBal : null,
    }
  } catch (err: any) {
    console.error('Failed to fetch Eganow balances:', err.message)
    return { collectionBalance: null, payoutBalance: null }
  }
}

export default async function LedgerPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || DEFAULT_LIMIT

  const payload = await getPayload({ config: configPromise })

  const [topupsResult, completedTotal, balances] = await Promise.all([
    payload.find({
      collection: 'ledger-topups',
      page,
      limit,
      sort: '-createdAt',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'ledger-topups',
      where: { status: { equals: 'completed' } },
      pagination: false,
      select: { amount: true },
      overrideAccess: true,
    }),
    fetchEganowBalances(),
  ])

  const totalTopupAmount = completedTotal.docs.reduce(
    (sum: number, doc: any) => sum + (doc.amount || 0),
    0,
  )

  const topups = topupsResult.docs.map((t: any) => ({
    id: t.id,
    amount: t.amount,
    phoneNumber: t.phoneNumber,
    accountName: t.accountName || '—',
    provider: t.provider,
    status: t.status,
    transactionReference: t.transactionReference || '—',
    createdAt: t.createdAt,
  }))

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Total Top-Ups (Completed)"
          value={`GHS ${totalTopupAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={ArrowDownToLine}
          description={`${completedTotal.totalDocs} completed top-up${completedTotal.totalDocs !== 1 ? 's' : ''}`}
        />
        <MetricCard
          title="All Top-Ups"
          value={topupsResult.totalDocs.toLocaleString()}
          icon={Wallet}
          description="Total top-up records"
        />
      </div>

      <LedgerClient
        initialCollectionBalance={balances.collectionBalance}
        initialPayoutBalance={balances.payoutBalance}
        topups={topups}
        fillParent
        pagination={{
          currentPage: page,
          totalPages: topupsResult.totalPages,
          totalRows: topupsResult.totalDocs,
          rowsPerPage: limit,
        }}
      />
    </div>
  )
}
