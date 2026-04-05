import { PayloadRequest } from 'payload'
import { getCharges } from '@/utilities/getCharges'
import type { User, PaymentMethod } from '@/payload-types'

/**
 * GET /api/transactions/get-payout-minimum
 *
 * Returns the minimum payout amount for the authenticated user
 * based on their country and withdrawal payment method.
 */
export const getPayoutMinimum = async (req: PayloadRequest) => {
  try {
    if (!req.user) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const user = req.user as User

    const withdrawalPaymentMethod = user.withdrawalPaymentMethod
    const paymentMethodSlug =
      typeof withdrawalPaymentMethod === 'object' && withdrawalPaymentMethod !== null
        ? (withdrawalPaymentMethod as PaymentMethod).slug
        : (withdrawalPaymentMethod as string | null | undefined)

    const country = (user.country as string | undefined)?.toLowerCase().trim()

    const charges = await getCharges(req.payload, {
      amount: 0,
      type: 'payout',
      paymentMethod: paymentMethodSlug ?? 'mobile-money',
      country,
    })

    return Response.json({
      success: true,
      minimumPayoutAmount: charges.minimumPayoutAmount,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to fetch payout minimum' },
      { status: 500 },
    )
  }
}
