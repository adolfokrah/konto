import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { buildCampaignRequest } from '@/utilities/changoCampaign'

const ACCOUNT = {
  CHANGO_BANK_ID: 'bank-uuid',
  CHANGO_BRANCH_ID: 'branch-uuid',
  CHANGO_PAYMENT_DESTINATION_NUMBER: '54657686548',
}

describe('buildCampaignRequest', () => {
  const saved = { ...process.env }
  beforeEach(() => Object.assign(process.env, ACCOUNT))
  afterEach(() => {
    process.env = { ...saved }
  })

  it('maps a jar with a deadline and goal to a temporary campaign', () => {
    const request = buildCampaignRequest({
      id: 'j1',
      name: 'Wedding fund',
      description: 'For the big day',
      goalAmount: 5000,
      deadline: '2027-06-01T00:00:00.000Z',
    })

    expect(request).toEqual({
      campaign_name: 'Wedding fund',
      campaign_type: 'temporary',
      description: 'For the big day',
      bank_id: 'bank-uuid',
      branch_id: 'branch-uuid',
      payment_destination_number: '54657686548',
      end: '2027-06-01T00:00:00.000Z',
      target: 5000,
      hide_total_amount: false,
      hide_donor_count: false,
      hide_donors: false,
    })
  })

  it('keeps an open-ended jar running with no target', () => {
    const request = buildCampaignRequest({ id: 'j2', name: 'Church dues' })

    expect(request.campaign_type).toBe('perpetual')
    expect(request).not.toHaveProperty('end')
    expect(request.target).toBe(0)
    expect(request.description).toBe('Church dues')
  })

  it('refuses to build a campaign without a settlement account', () => {
    delete process.env.CHANGO_BANK_ID
    expect(() => buildCampaignRequest({ id: 'j3', name: 'x' })).toThrow('CHANGO_BANK_ID')
  })
})
