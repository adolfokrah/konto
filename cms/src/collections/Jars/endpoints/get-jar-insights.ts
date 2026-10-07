import type { PayloadRequest } from 'payload'

/**
 * GET /api/jars/:id/insights?period=week|month|all
 *
 * Access: the jar's creator or an accepted *admin* collector gets the full
 * jar insights. An accepted plain collector gets 403 (`code: 'organizer_only'`)
 * — insights are an organizer tool, so we don't build a second, scoped variant.
 * Anyone else gets 404 so jar ids can't be probed.
 *
 * Only completed contributions count. Dates are bucketed in UTC (Ghana is UTC+0).
 */

export type InsightsPeriod = 'week' | 'month' | 'all'
export type MethodKey = 'mtn' | 'telecel' | 'airteltigo' | 'card' | 'cash' | 'other'

export interface InsightTx {
  amountContributed?: number | null
  paymentMethod?: string | null
  mobileMoneyProvider?: string | null
  collector?: string | { id: string } | null
  collectorSnapshot?: { name?: string | null } | null
  contributor?: string | null
  contributorPhoneNumber?: string | null
  createdAt: string
}

const DAY = 24 * 60 * 60 * 1000
const METHOD_ORDER: MethodKey[] = ['mtn', 'telecel', 'airteltigo', 'card', 'cash', 'other']

const round2 = (n: number) => Math.round(n * 100) / 100

export function methodKeyOf(
  tx: Pick<InsightTx, 'paymentMethod' | 'mobileMoneyProvider'>,
): MethodKey {
  switch (tx.paymentMethod) {
    case 'card':
    case 'apple-pay':
      return 'card'
    case 'cash':
      return 'cash'
    case 'mobile-money': {
      const p = (tx.mobileMoneyProvider ?? '').toLowerCase().trim()
      if (p.startsWith('mtn')) return 'mtn'
      if (p.startsWith('telecel') || p.startsWith('vod')) return 'telecel'
      if (p === 'at' || p.startsWith('airtel') || p.startsWith('tigo')) return 'airteltigo'
      return 'other'
    }
    default:
      return 'other'
  }
}

/** [start, end) of the selected window and of the equivalent preceding one. */
export function periodWindows(
  period: InsightsPeriod,
  now: Date,
  jarCreatedAt: Date,
): { start: Date; end: Date; prevStart: Date | null; prevEnd: Date | null } {
  const end = now
  if (period === 'week') {
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const start = new Date(todayStart - 6 * DAY)
    return { start, end, prevStart: new Date(start.getTime() - 7 * DAY), prevEnd: start }
  }
  if (period === 'month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const prevStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    return { start, end, prevStart, prevEnd: start }
  }
  return { start: jarCreatedAt, end, prevStart: null, prevEnd: null }
}

export function computeJarInsights(
  txs: InsightTx[],
  opts: { period: InsightsPeriod; now: Date; jarCreatedAt: Date },
) {
  const { period, now, jarCreatedAt } = opts
  const { start, end, prevStart, prevEnd } = periodWindows(period, now, jarCreatedAt)
  const t = (tx: InsightTx) => new Date(tx.createdAt).getTime()
  const amt = (tx: InsightTx) => Number(tx.amountContributed ?? 0)

  const inRange = txs.filter((tx) => t(tx) >= start.getTime() && t(tx) <= end.getTime())
  const prevRange =
    prevStart && prevEnd
      ? txs.filter((tx) => t(tx) >= prevStart.getTime() && t(tx) < prevEnd.getTime())
      : []

  const total = inRange.reduce((s, tx) => s + amt(tx), 0)
  const previousTotal = prevStart ? prevRange.reduce((s, tx) => s + amt(tx), 0) : null
  const changePct =
    previousTotal != null && previousTotal > 0
      ? Math.round(((total - previousTotal) / previousTotal) * 100)
      : null

  // Weekday totals, Mon..Sun
  const byWeekday = [0, 0, 0, 0, 0, 0, 0]
  for (const tx of inRange) {
    const idx = (new Date(tx.createdAt).getUTCDay() + 6) % 7
    byWeekday[idx] += amt(tx)
  }
  let bestWeekday: { index: number; multipleOfAverage: number } | null = null
  if (total > 0) {
    const avg = total / 7
    let best = 0
    for (let i = 1; i < 7; i++) if (byWeekday[i] > byWeekday[best]) best = i
    bestWeekday = { index: best, multipleOfAverage: Math.round((byWeekday[best] / avg) * 10) / 10 }
  }

  // Payment mix
  const mix = new Map<MethodKey, number>()
  for (const tx of inRange) {
    const k = methodKeyOf(tx)
    mix.set(k, (mix.get(k) ?? 0) + amt(tx))
  }
  const methodMix = METHOD_ORDER.filter((k) => (mix.get(k) ?? 0) > 0).map((key) => {
    const amount = mix.get(key) ?? 0
    return { key, amount: round2(amount), pct: total > 0 ? Math.round((amount / total) * 100) : 0 }
  })

  // Top collectors (contributions with no collector are skipped)
  const collectors = new Map<string, { id: string; name: string; amount: number; count: number }>()
  for (const tx of inRange) {
    const id = typeof tx.collector === 'object' ? tx.collector?.id : tx.collector
    if (!id) continue
    const entry = collectors.get(id) ?? {
      id,
      name: tx.collectorSnapshot?.name ?? '',
      amount: 0,
      count: 0,
    }
    entry.amount += amt(tx)
    entry.count += 1
    if (!entry.name && tx.collectorSnapshot?.name) entry.name = tx.collectorSnapshot.name
    collectors.set(id, entry)
  }
  const topCollectors = [...collectors.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((c) => ({ ...c, amount: round2(c.amount) }))

  const contributorKeys = new Set<string>()
  for (const tx of inRange) {
    const key = (tx.contributorPhoneNumber || tx.contributor || '').trim().toLowerCase()
    if (key) contributorKeys.add(key)
  }

  return {
    period,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    total: round2(total),
    previousTotal: previousTotal == null ? null : round2(previousTotal),
    changePct,
    paymentsCount: inRange.length,
    byWeekday: byWeekday.map(round2),
    bestWeekday,
    methodMix,
    topCollectors,
    averageGift: inRange.length > 0 ? round2(total / inRange.length) : 0,
    contributorsCount: contributorKeys.size,
    paymentsCountAllTime: txs.length,
    totalAllTime: round2(txs.reduce((s, tx) => s + amt(tx), 0)),
  }
}

export const getJarInsights = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  const user = req.user
  const jarId = req.routeParams?.id as string | undefined
  const rawPeriod = (req.query?.period as string | undefined) ?? 'month'
  const period: InsightsPeriod = rawPeriod === 'week' || rawPeriod === 'all' ? rawPeriod : 'month'

  const notFound = () =>
    Response.json({ success: false, message: 'Jar not found' }, { status: 404 })

  if (!jarId || jarId === 'null') return notFound()

  let jar: any = null
  try {
    jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 0,
      overrideAccess: true,
      select: {
        creator: true,
        invitedCollectors: true,
        goalAmount: true,
        deadline: true,
        currency: true,
        createdAt: true,
        status: true,
      },
    })
  } catch {
    jar = null
  }
  if (!jar) return notFound()

  const idOf = (v: any) => (typeof v === 'object' && v !== null ? v.id : v)
  const isCreator = idOf(jar.creator) === user.id
  const membership = (jar.invitedCollectors ?? []).find(
    (ic: any) => idOf(ic.collector) === user.id && ic.status === 'accepted',
  )
  if (!isCreator && !membership) return notFound()
  if (!isCreator && membership?.role !== 'admin') {
    return Response.json(
      {
        success: false,
        code: 'organizer_only',
        message: "Insights are only available to the jar's organizers",
      },
      { status: 403 },
    )
  }

  // Fetch completed contributions in pages with only the fields we need.
  const txs: InsightTx[] = []
  const PAGE = 1000
  for (let page = 1; ; page++) {
    const res = await req.payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: jar.id },
        type: { equals: 'contribution' },
        paymentStatus: { equals: 'completed' },
      },
      depth: 0,
      limit: PAGE,
      page,
      sort: 'createdAt',
      overrideAccess: true,
      select: {
        amountContributed: true,
        paymentMethod: true,
        mobileMoneyProvider: true,
        collector: true,
        collectorSnapshot: true,
        contributor: true,
        contributorPhoneNumber: true,
        createdAt: true,
      },
    })
    txs.push(...(res.docs as unknown as InsightTx[]))
    if (!res.hasNextPage) break
  }

  const insights = computeJarInsights(txs, {
    period,
    now: new Date(),
    jarCreatedAt: new Date(jar.createdAt),
  })

  // Money out over the same window: completed payouts (stored as negative
  // amountContributed). Shown beside "Collected"; never part of the other
  // figures or the 5-payment threshold.
  const { start, end } = periodWindows(period, new Date(), new Date(jar.createdAt))
  const payouts = await req.payload.find({
    collection: 'transactions',
    where: {
      jar: { equals: jar.id },
      type: { equals: 'payout' },
      paymentStatus: { equals: 'completed' },
      createdAt: { greater_than_equal: start.toISOString(), less_than_equal: end.toISOString() },
    },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { amountContributed: true },
  })
  const transferredOut =
    Math.round(
      payouts.docs.reduce(
        (sum: number, tx: any) => sum + Math.abs(Number(tx.amountContributed) || 0),
        0,
      ) * 100,
    ) / 100

  // Fill collector names from the users collection (snapshot may be missing).
  const missing = insights.topCollectors.filter((c) => !c.name).map((c) => c.id)
  if (missing.length > 0) {
    const users = await req.payload.find({
      collection: 'users',
      where: { id: { in: missing } },
      depth: 0,
      limit: missing.length,
      overrideAccess: true,
      select: { firstName: true, lastName: true },
    })
    const names = new Map(
      users.docs.map((u: any) => [
        u.id,
        `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || 'Collector',
      ]),
    )
    for (const c of insights.topCollectors) if (!c.name) c.name = names.get(c.id) ?? 'Collector'
  }

  return Response.json({
    success: true,
    message: 'Jar insights retrieved successfully',
    data: {
      ...insights,
      transferredOut,
      transfersCount: payouts.docs.length,
      currency: jar.currency ?? 'GHS',
      goalAmount: jar.goalAmount ?? null,
      deadline: jar.deadline ?? null,
      createdAt: jar.createdAt,
    },
  })
}
