import type { PayloadRequest } from 'payload'
import { getEganow } from '@/utilities/initalise'
import { bankName } from '@/utilities/eganowBanks'

// Small in-memory cache (bank list rarely changes).
let cache: { at: number; data: { code: string; name: string }[] } | null = null
const TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * GET /api/transactions/banks
 * Returns supported banks for payout: [{ code, name }], from Eganow Paypartner
 * Search (transType=BANK) mapped to display names.
 */
export const getBanks = async (_req: PayloadRequest) => {
  try {
    if (cache && Date.now() - cache.at < TTL_MS) {
      return Response.json({ success: true, data: cache.data })
    }

    const partners = await getEganow().searchPaypartners()
    const banks = (Array.isArray(partners) ? partners : [])
      .filter((p) => (p?.transType || '').toUpperCase() === 'BANK')
      .map((p) => ({ code: p.paypartnerCode, name: bankName(p.paypartnerCode) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    cache = { at: Date.now(), data: banks }
    return Response.json({ success: true, data: banks })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error?.message || 'Failed to fetch banks', data: [] },
      { status: 500 },
    )
  }
}
