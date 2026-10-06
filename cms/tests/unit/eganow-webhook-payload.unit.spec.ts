import { describe, expect, it } from 'vitest'

import { normalizeWebhookPayload } from '@/collections/Transactions/endpoints/eganow-webhook'

describe('normalizeWebhookPayload', () => {
  it('reads our contribution id from merchantReference on hosted checkout callbacks', () => {
    const result = normalizeWebhookPayload({
      transactionId: '81eeef1ade4e46628b1ed66852d9c3f7',
      merchantReference: 'contribution-123',
      status: 'success',
      message: 'SUCCESSFUL',
    })

    expect(result.transactionId).toBe('contribution-123')
    expect(result.eganowReferenceNo).toBe('81eeef1ade4e46628b1ed66852d9c3f7')
    expect(result.transactionStatus).toBe('success')
  })

  it('still reads direct collection callbacks', () => {
    const result = normalizeWebhookPayload({
      TransactionId: 'contribution-456',
      EganowReferenceNo: 'EGA-1',
      TransactionStatus: 'SUCCESSFUL',
      PayPartnerTransactionId: 'PP-1',
    })

    expect(result.transactionId).toBe('contribution-456')
    expect(result.eganowReferenceNo).toBe('EGA-1')
    expect(result.transactionStatus).toBe('SUCCESSFUL')
    expect(result.payPartnerTransactionId).toBe('PP-1')
  })
})
