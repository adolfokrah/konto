import type { PayloadRequest } from 'payload'
import { getJarBalance } from '@/utilities/getJarBalance'

export const getJarSummary = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const user = req.user
  const jarId = req.routeParams?.id as string | undefined

  async function getUserJar() {
    const result = await req.payload.find({
      collection: 'jars',
      pagination: false,
      where: {
        or: [
          {
            creator: { equals: user },
            status: { not_equals: 'broken' },
          },
          {
            'invitedCollectors.collector': { equals: user },
            'invitedCollectors.status': { equals: 'accepted' },
            status: { not_equals: 'broken' },
          },
        ],
      },
      depth: 3,
    })

    // Return first jar whose creator is still a populated object (not deleted)
    return result.docs.find((j) => typeof j.creator === 'object' && j.creator !== null) ?? null
  }

  let jar: any = null

  try {
    if (jarId && jarId !== 'null') {
      const result = await req.payload.find({
        collection: 'jars',
        where: { id: { equals: jarId } },
        depth: 2,
        limit: 1,
      })

      jar = result.docs[0] ?? null

      // Creator deleted — string ID remains; fall back to user's jar
      if (jar && typeof jar.creator === 'string') {
        jar = await getUserJar()
      }

      // No access to this jar — fall back to user's jar
      if (jar) {
        const isCreator = jar.creator?.id === user.id
        const isInvitedCollector = jar.invitedCollectors?.some(
          (c: { collector?: { id: string }; status?: string }) =>
            c.collector?.id === user.id && c.status === 'accepted',
        )
        if (!isCreator && !isInvitedCollector) {
          jar = await getUserJar()
        }
      }
    } else {
      jar = await getUserJar()
    }
  } catch {
    jar = await getUserJar()
  }

  if (jar === null) {
    return Response.json({ success: true, message: 'Jar not found', data: null }, { status: 200 })
  }

  const isJarCreator = jar.creator?.id === user.id
  const isAdminCollector =
    Array.isArray(jar.invitedCollectors) &&
    jar.invitedCollectors.some((ic: any) => {
      const collectorId = typeof ic.collector === 'object' ? ic.collector?.id : ic.collector
      return collectorId === user.id && ic.role === 'admin' && ic.status === 'accepted'
    })
  const hasFullAccess = isJarCreator || isAdminCollector

  const [{ balance }, recentContributions, allTransactions] = await Promise.all([
    getJarBalance(req.payload, jar.id),
    req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jar.id },
        type: { not_equals: 'refund' },
        ...(hasFullAccess ? {} : { collector: { equals: user } }),
      },
      limit: 5,
      sort: '-createdAt',
    }),
    req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jar.id },
        ...(hasFullAccess ? {} : { collector: { equals: user } }),
      },
      pagination: false,
      select: {
        amountContributed: true,
        paymentStatus: true,
        paymentMethod: true,
        type: true,
        paid: true,
        chargesBreakdown: true,
        isSettled: true,
        createdAt: true,
      },
    }),
  ])

  const txDocs = allTransactions.docs

  // --- Chart: daily contribution totals for the last 10 days ---
  const completedContributions = txDocs.filter(
    (tx: any) => tx.type === 'contribution' && tx.paymentStatus === 'completed',
  )

  const chartData = (() => {
    if (completedContributions.length === 0) return Array(10).fill(0)

    const now = new Date()
    const dailyTotals: Record<string, number> = {}

    completedContributions.forEach((tx: any) => {
      const d = new Date(tx.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyTotals[key] = (dailyTotals[key] ?? 0) + tx.amountContributed
    })

    return Array.from({ length: 10 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (9 - i))
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return dailyTotals[key] ?? 0
    })
  })()

  // --- Payment method breakdown ---
  const PAYMENT_METHODS: Record<string, string> = {
    cash: 'cash',
    bankTransfer: 'bank',
    mobileMoney: 'mobile-money',
    card: 'card',
    applePay: 'apple-pay',
  }

  const paymentBreakdown: Record<string, Record<string, number>> = {}
  for (const [key, method] of Object.entries(PAYMENT_METHODS)) {
    const filtered = completedContributions.filter((tx: any) => tx.paymentMethod === method)
    const label = key.charAt(0).toUpperCase() + key.slice(1)
    paymentBreakdown[key] = {
      [`total${label}Amount`]: filtered.reduce((s: number, tx: any) => s + tx.amountContributed, 0),
      [`total${label}Count`]: filtered.length,
    }
  }

  // --- Balance figures ---
  const totalContributedAmount = completedContributions.reduce(
    (s: number, tx: any) => s + tx.amountContributed,
    0,
  )

  const unsettledContributionsSum = txDocs
    .filter(
      (tx: any) =>
        tx.type === 'contribution' &&
        tx.paymentStatus === 'completed' &&
        tx.isSettled === false &&
        tx.paymentMethod === 'mobile-money',
    )
    .reduce((s: number, tx: any) => s + tx.amountContributed, 0)

  const allCompletedContributionsSum = completedContributions.reduce(
    (s: number, tx: any) => s + tx.amountContributed,
    0,
  )

  const payoutsSum = txDocs
    .filter(
      (tx: any) =>
        tx.type === 'payout' &&
        (tx.paymentStatus === 'pending' ||
          tx.paymentStatus === 'completed' ||
          tx.paymentStatus === 'awaiting-approval'),
    )
    .reduce((s: number, tx: any) => s + tx.amountContributed, 0)

  const totalYouOwe = allCompletedContributionsSum + payoutsSum

  // --- Charges breakdown ---
  const totalPlatformCharge = txDocs.reduce(
    (s: number, tx: any) => s + (tx.chargesBreakdown?.platformCharge ?? 0),
    0,
  )

  const totalAmountPaidByContributors = txDocs.reduce(
    (s: number, tx: any) =>
      s + (tx.chargesBreakdown?.amountPaidByContributor ?? tx.amountContributed),
    0,
  )

  const round2 = (n: number) => Number(n.toFixed(2))

  return Response.json({
    success: true,
    message: 'Jar summary retrieved successfully',
    data: {
      ...jar,
      invitedCollectors: jar.invitedCollectors.filter(
        (ic: { collector?: any }) => typeof ic.collector === 'object',
      ),
      contributions: recentContributions,
      chartData,
      isCreator: jar.creator?.id === user.id,
      balanceBreakDown: {
        totalContributedAmount: round2(totalContributedAmount),
        totalAmountTobeTransferred: round2(balance),
        upcomingBalance: round2(unsettledContributionsSum),
        totalYouOwe: round2(totalYouOwe),
        ...paymentBreakdown,
      },
      chargesBreakdown: {
        totalPlatformCharge: round2(totalPlatformCharge),
        totalAmountPaidByContributors: round2(totalAmountPaidByContributors),
      },
    },
  })
}
