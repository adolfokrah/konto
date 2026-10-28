import { describe, expect, it } from 'vitest'

import { findChangoReferences } from '@/collections/Transactions/endpoints/chango-webhook'

describe('findChangoReferences', () => {
  it('collects references at any depth', () => {
    expect(
      findChangoReferences({
        invoiceId: 'inv-1',
        data: { transactionReference: 'chk-1', amount: '10.00' },
      }),
    ).toEqual(['inv-1', 'chk-1'])
  })

  it('ignores bodies without references', () => {
    expect(findChangoReferences({ status: 'SUCCESS' })).toEqual([])
    expect(findChangoReferences(null)).toEqual([])
  })
})
