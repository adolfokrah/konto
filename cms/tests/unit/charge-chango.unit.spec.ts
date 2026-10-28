import { describe, expect, it } from 'vitest'

import { toChangoMsisdn } from '@/collections/Transactions/endpoints/charge-chango'

describe('toChangoMsisdn', () => {
  it('puts Ghana numbers in the 233 form Chango expects', () => {
    expect(toChangoMsisdn('024 123 4567')).toBe('233241234567')
    expect(toChangoMsisdn('+233 24 123 4567')).toBe('233241234567')
    expect(toChangoMsisdn('233241234567')).toBe('233241234567')
  })
})
