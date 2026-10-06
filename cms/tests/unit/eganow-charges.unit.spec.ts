import { describe, expect, it } from 'vitest'

import { momoPaypartnerForPhone, splitEganowCharges } from '@/utilities/eganowCharges'

describe('splitEganowCharges', () => {
  it("splits Eganow's quoted fee by the Hogapay share of the total fee", () => {
    // 2% total, 0.8% Hogapay → Hogapay gets 40% of whatever Eganow charges.
    const split = splitEganowCharges({
      amountToSendToEganow: 100,
      discountAmount: 0,
      totalCharges: 1.5,
      collectionFeePercent: 2,
      hogapayFeePercent: 0.8,
    })
    expect(split).toEqual({
      platformCharge: 1.5,
      amountPaidByContributor: 101.5,
      hogapayRevenue: 0.6,
      eganowFees: 0.9,
    })
  })

  it('takes a discount out of the Hogapay share only', () => {
    const split = splitEganowCharges({
      amountToSendToEganow: 99.6,
      discountAmount: 0.4,
      totalCharges: 2,
      collectionFeePercent: 2,
      hogapayFeePercent: 0.8,
    })
    expect(split.eganowFees).toBe(1.2)
    expect(split.hogapayRevenue).toBe(0.4)
    expect(split.amountPaidByContributor).toBe(101.6)
  })

  it('gives everything to Eganow when there is no total fee setting', () => {
    const split = splitEganowCharges({
      amountToSendToEganow: 50,
      discountAmount: 0,
      totalCharges: 1,
      collectionFeePercent: 0,
      hogapayFeePercent: 0.8,
    })
    expect(split).toMatchObject({ hogapayRevenue: 0, eganowFees: 1 })
  })
})

describe('momoPaypartnerForPhone', () => {
  it('maps Ghana prefixes to networks', () => {
    expect(momoPaypartnerForPhone('0241234567')).toBe('MTNGH')
    expect(momoPaypartnerForPhone('233551234567')).toBe('MTNGH')
    expect(momoPaypartnerForPhone('0201234567')).toBe('TCELGH')
    expect(momoPaypartnerForPhone('0271234567')).toBe('ATGH')
    expect(momoPaypartnerForPhone('0311234567')).toBeNull()
  })
})
