import { describe, expect, it } from 'vitest'

import { toJarContribution } from '@/utilities/changoContributions'

describe('toJarContribution', () => {
  it("reads Chango's zoneless timestamps as UTC and its string amounts as numbers", () => {
    expect(
      toJarContribution({
        contributorName: 'Adolphus',
        created: '2026-10-28T11:19:23',
        amount: '50.00',
        currency: 'GHS',
      }),
    ).toEqual({
      contributor: 'Adolphus',
      amountContributed: 50,
      createdAt: '2026-10-28T11:19:23.000Z',
    })
  })

  it('names unnamed contributors Anonymous', () => {
    const c = toJarContribution({
      contributorName: '',
      created: '2026-10-28T11:19:23Z',
      amount: '5',
      currency: 'GHS',
    })
    expect(c.contributor).toBe('Anonymous')
  })
})
