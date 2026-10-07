import { describe, expect, it } from 'vitest'

import { computeJarInsights, methodKeyOf } from '@/collections/Jars/endpoints/get-jar-insights'

// Wed 15 Oct 2025, noon UTC
const now = new Date('2025-10-15T12:00:00Z')
const created = new Date('2025-09-01T00:00:00Z')

const tx = (createdAt: string, amount: number, extra: Record<string, any> = {}) => ({
  createdAt,
  amountContributed: amount,
  paymentMethod: 'mobile-money',
  mobileMoneyProvider: 'mtn',
  ...extra,
})

describe('methodKeyOf', () => {
  it('maps providers and methods to mix keys', () => {
    expect(methodKeyOf({ paymentMethod: 'mobile-money', mobileMoneyProvider: 'MTN' })).toBe('mtn')
    expect(methodKeyOf({ paymentMethod: 'mobile-money', mobileMoneyProvider: 'vodafone' })).toBe(
      'telecel',
    )
    expect(methodKeyOf({ paymentMethod: 'mobile-money', mobileMoneyProvider: 'at' })).toBe(
      'airteltigo',
    )
    expect(methodKeyOf({ paymentMethod: 'apple-pay' })).toBe('card')
    expect(methodKeyOf({ paymentMethod: 'cash' })).toBe('cash')
    expect(methodKeyOf({ paymentMethod: 'bank' })).toBe('other')
  })
})

describe('computeJarInsights', () => {
  const txs = [
    tx('2025-09-10T10:00:00Z', 100, { collector: 'u1', contributorPhoneNumber: '0241' }), // previous month
    tx('2025-10-04T10:00:00Z', 300, { collector: 'u1', contributorPhoneNumber: '0241' }), // Sat
    tx('2025-10-11T10:00:00Z', 200, {
      collector: 'u2',
      contributor: 'Kofi',
      paymentMethod: 'cash',
    }), // Sat
    tx('2025-10-13T10:00:00Z', 100, { collector: 'u2', contributorPhoneNumber: '0555' }), // Mon
  ]

  it('computes the month window with change against last month', () => {
    const r = computeJarInsights(txs, { period: 'month', now, jarCreatedAt: created })
    expect(r.total).toBe(600)
    expect(r.previousTotal).toBe(100)
    expect(r.changePct).toBe(500)
    expect(r.paymentsCount).toBe(3)
    expect(r.byWeekday).toEqual([100, 0, 0, 0, 0, 500, 0])
    expect(r.bestWeekday).toEqual({ index: 5, multipleOfAverage: 5.8 })
    expect(r.methodMix).toEqual([
      { key: 'mtn', amount: 400, pct: 67 },
      { key: 'cash', amount: 200, pct: 33 },
    ])
    expect(r.topCollectors.map((c) => [c.id, c.amount, c.count])).toEqual([
      ['u1', 300, 1],
      ['u2', 300, 2],
    ])
    expect(r.averageGift).toBe(200)
    expect(r.contributorsCount).toBe(3)
    expect(r.totalAllTime).toBe(700)
    expect(r.paymentsCountAllTime).toBe(4)
  })

  it('uses the current calendar week for week, against last week', () => {
    // now = Wed 15 Oct: this week is Mon 13 Oct onwards.
    const r = computeJarInsights(txs, { period: 'week', now, jarCreatedAt: created })
    expect(r.total).toBe(100)
    expect(r.previousTotal).toBe(200)
    expect(r.changePct).toBe(-50)
  })

  it('has no change for all time and handles empty jars', () => {
    const r = computeJarInsights(txs, { period: 'all', now, jarCreatedAt: created })
    expect(r.total).toBe(700)
    expect(r.changePct).toBeNull()
    expect(r.previousTotal).toBeNull()
    const empty = computeJarInsights([], { period: 'all', now, jarCreatedAt: created })
    expect(empty.bestWeekday).toBeNull()
    expect(empty.averageGift).toBe(0)
  })
})

describe('insights timeline', () => {
  const txs = [
    tx('2025-10-15T09:00:00Z', 100), // Wed (today)
    tx('2025-10-13T09:00:00Z', 50), // Mon this week
    tx('2025-10-10T09:00:00Z', 30), // Fri last week
    tx('2025-10-02T09:00:00Z', 20), // earlier this month
    tx('2025-09-05T09:00:00Z', 10), // last month
  ]

  it('week: the current week, Mon..Sun, future days empty', () => {
    const insights = computeJarInsights(txs, { period: 'week', now, jarCreatedAt: created })
    expect(insights.timeline.map((b) => b.label)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
    expect(insights.timeline.map((b) => b.amount)).toEqual([50, 0, 100, 0, 0, 0, 0])
    // Totals use the same window: this week vs last week.
    expect(insights.total).toBe(150)
    expect(insights.previousTotal).toBe(30)
  })

  it('month: the current month, one bar per week', () => {
    const { timeline } = computeJarInsights(txs, { period: 'month', now, jarCreatedAt: created })
    expect(timeline.map((b) => b.label)).toEqual(['1-7', '8-14', '15-21', '22-28', '29-31'])
    expect(timeline.map((b) => b.amount)).toEqual([20, 30 + 50, 100, 0, 0])
  })

  it('all time: last 12 months, one bar per month', () => {
    const insights = computeJarInsights(txs, { period: 'all', now, jarCreatedAt: created })
    expect(insights.timeline).toHaveLength(12)
    expect(insights.timeline[0].label).toBe('Nov')
    expect(insights.timeline[11].label).toBe('Oct')
    expect(insights.timeline[10].amount).toBe(10) // Sep
    expect(insights.timeline[11].amount).toBe(200) // Oct
  })
})
