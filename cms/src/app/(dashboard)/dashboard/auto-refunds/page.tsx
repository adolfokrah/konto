import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AutoRefundActions } from '@/components/dashboard/auto-refund-actions'
import { RefundStatusBadge } from '@/components/dashboard/refund-status-badge'

function formatAmount(amount: number, currency = 'GHS') {
  return `${currency} ${amount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type JarGroup = {
  jarId: string
  jarName: string
  currency: string
  totalAmount: number
  contributors: number
  triggeredAt: string | null
  status: 'awaiting_approval' | 'processing' | 'completed' | 'mixed'
}


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
  const jarMap: Record<string, JarGroup> = {}
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
        triggeredAt: r.triggeredAt || null,
        status: r.status,
      }
    }
    jarMap[jarId].totalAmount += amount
    jarMap[jarId].contributors += 1

    // Compute group status
    const prev = jarMap[jarId].status
    if (prev !== r.status) {
      jarMap[jarId].status = 'mixed'
    }
  }

  const groups = Object.values(jarMap)
  const pendingCount = groups.filter((g) => g.status === 'awaiting_approval').length
  const processingCount = groups.filter((g) => g.status === 'processing').length
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
          <CardDescription>{groups.length} jar{groups.length !== 1 ? 's' : ''} with auto refunds</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No auto refunds found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Jar</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Total Amount</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Contributors</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Triggered</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {groups.map((group) => {
                    return (
                      <tr key={group.jarId}>
                        <td className="py-3 pr-4 font-medium">
                          <Link href={`/dashboard/jars/${group.jarId}`} className="hover:underline">
                            {group.jarName}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {formatAmount(group.totalAmount, group.currency)}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">{group.contributors}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(group.triggeredAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <RefundStatusBadge status={group.status} />
                        </td>
                        <td className="py-3">
                          {group.status === 'awaiting_approval' ? (
                            <AutoRefundActions jarId={group.jarId} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
