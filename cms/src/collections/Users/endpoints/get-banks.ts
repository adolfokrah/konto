import type { PayloadRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

/**
 * GET /users/banks?country=ghana&type=mobile_money
 *
 * Proxies the Paystack /bank endpoint so the mobile app never needs
 * the Paystack secret key directly.
 *
 * Query params:
 *   country  – e.g. "ghana" (default: "ghana")
 *   type     – "mobile_money" | "ghipss" (omit for all)
 */
export const getBanks = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url)
    const country = url.searchParams.get('country') ?? 'ghana'
    const type = url.searchParams.get('type') ?? undefined

    const banks = await getPaystack().listBanks({ country, type, perPage: 100 })

    const active = banks.filter((b) => b.active && !b.is_deleted)

    return Response.json({ success: true, data: active }, { status: 200 })
  } catch (error: any) {
    console.error('[get-banks]', error.message)
    return Response.json(
      { success: false, message: 'Failed to fetch banks', data: [] },
      { status: 500 },
    )
  }
}
