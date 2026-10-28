import { describe, expect, it } from 'vitest'

import { matchChangoContributions } from '@/utilities/changoReconcile'

const paid = (contributor: string, amount: number, at: string) => ({
  contributor,
  amountContributed: amount,
  createdAt: at,
})
const tx = (id: string, contributor: string, amount: number, at: string, status = 'pending') => ({
  id,
  contributor,
  amountContributed: amount,
  createdAt: at,
  paymentStatus: status,
})

describe('matchChangoContributions', () => {
  it('confirms the pending transaction a Chango payment belongs to', () => {
    expect(
      matchChangoContributions(
        [paid('Adolphus', 50, '2026-10-28T11:19:23Z')],
        [tx('a', 'Adolphus', 50, '2026-10-28T11:17:24Z')],
      ),
    ).toEqual(['a'])
  })

  it('ignores transactions with a different name or amount, or created after the payment', () => {
    expect(
      matchChangoContributions(
        [paid('Adolphus', 50, '2026-10-28T11:19:23Z')],
        [
          tx('name', 'Ama', 50, '2026-10-28T11:17:00Z'),
          tx('amount', 'Adolphus', 20, '2026-10-28T11:17:00Z'),
          tx('later', 'Adolphus', 50, '2026-10-28T12:00:00Z'),
        ],
      ),
    ).toEqual([])
  })

  it('never counts one payment twice: a completed transaction claims it first', () => {
    expect(
      matchChangoContributions(
        [paid('Adolphus', 50, '2026-10-28T11:19:23Z')],
        [
          tx('done', 'Adolphus', 50, '2026-10-28T11:10:00Z', 'completed'),
          tx('abandoned', 'Adolphus', 50, '2026-10-28T11:16:00Z'),
        ],
      ),
    ).toEqual([])
  })

  it('pairs repeat payments one to one, in time order', () => {
    expect(
      matchChangoContributions(
        [paid('Kofi', 10, '2026-10-28T10:05:00Z'), paid('Kofi', 10, '2026-10-28T10:20:00Z')],
        [
          tx('first', 'Kofi', 10, '2026-10-28T10:00:00Z'),
          tx('second', 'Kofi', 10, '2026-10-28T10:15:00Z'),
        ],
      ),
    ).toEqual(['first', 'second'])
  })

  it('matches names regardless of case and spacing', () => {
    expect(
      matchChangoContributions(
        [paid('Ama  Serwaa', 5, '2026-10-28T10:05:00Z')],
        [tx('t', 'ama serwaa', 5, '2026-10-28T10:00:00Z')],
      ),
    ).toEqual(['t'])
  })
})
