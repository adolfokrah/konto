import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AutoRefundsDataTable } from '@/components/dashboard/auto-refunds-data-table'
type AutoRefundRow = {
  jarId: string
  jarName: string
  currency: string
  totalAmount: number
  contributors: number
  triggeredAt: string | null
  status: 'awaiting_approval' | 'in-progress' | 'pending' | 'completed' | 'failed' | 'rejected'
}

const STATUS_PRIORITY = ['awaiting_approval', 'in-progress', 'pending', 'failed', 'rejected', 'completed']

export default async function AutoRefundsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'refunds',
    where: { refundType: { equals: 'auto' } },
    pagination: false,
    depth: 1,
    sort: '-triggeredAt',
    overrideAccess: true,
  })

  const refunds: any[] = result.docs

  // Group by jar
  const jarMap: Record<string, AutoRefundRow & { linkedTransactions: Set<string> }> = {}
  for (const r of refunds) {
    const jar = typeof r.jar === 'object' ? r.jar : null
    const jarId = jar?.id || r.jar
    const jarName = jar?.name || jarId || '—'
    const currency = jar?.currency || 'GHS'
    const amount = Math.abs(r.amount ?? 0)

    if (!jarMap[jarId]) {
      jarMap[jarId] = {
        jarId,
        jarName,
        currency,
        totalAmount: 0,
        contributors: 0,
        linkedTransactions: new Set(),
        triggeredAt: r.triggeredAt || null,
        status: r.status,
      }
    }

    const linkedTxId =
      typeof r.linkedTransaction === 'object' ? r.linkedTransaction?.id : r.linkedTransaction
    if (linkedTxId && !jarMap[jarId].linkedTransactions.has(linkedTxId)) {
      jarMap[jarId].linkedTransactions.add(linkedTxId)
      jarMap[jarId].totalAmount += amount
      jarMap[jarId].contributors += 1
    }

    // Compute group status — show the most active status by priority
    const prev = jarMap[jarId].status
    if (prev !== r.status) {
      const prevPriority = STATUS_PRIORITY.indexOf(prev)
      const curPriority = STATUS_PRIORITY.indexOf(r.status)
      if (curPriority !== -1 && (prevPriority === -1 || curPriority < prevPriority)) {
        jarMap[jarId].status = r.status
      }
    }
  }

  const groups: AutoRefundRow[] = Object.values(jarMap).map(({ linkedTransactions, ...rest }) => rest)

  const pendingCount = groups.filter((g) => g.status === 'awaiting_approval').length
  const processingCount = groups.filter((g) => g.status === 'in-progress').length
  const completedCount = groups.filter((g) => g.status === 'completed').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting Approval</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl">{processingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auto Refunds</CardTitle>
          <CardDescription>
            {groups.length} jar{groups.length !== 1 ? 's' : ''} with auto refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoRefundsDataTable data={groups} />
        </CardContent>
      </Card>
    </div>
  )
}
