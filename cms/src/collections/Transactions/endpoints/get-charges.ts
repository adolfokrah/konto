import { PayloadRequest } from 'payload'
import { calculatePaystackCharges } from '@/utilities/paystackCharges'

/**
 * GET /api/transactions/get-charges?amount=100&jarId=xxx
 *
 * Returns the full charge breakdown for a given amount.
 */
export const getCharges = async (req: PayloadRequest) => {
  try {
    const url = new URL(req.url || '', 'http://localhost')
    const amountParam = url.searchParams.get('amount')

    if (!amountParam) {
      return Response.json({ success: false, message: 'amount is required' }, { status: 400 })
    }

    const amountContributed = parseFloat(amountParam)
    if (isNaN(amountContributed) || amountContributed <= 0) {
      return Response.json(
        { success: false, message: 'amount must be a positive number' },
        { status: 400 },
      )
    }

    const charges = await calculatePaystackCharges(amountContributed, req.payload)

    return Response.json({ success: true, ...charges })
  } catch (error: any) {
    return Response.json(
      { success: false, message: error.message || 'Failed to calculate charges' },
      { status: 500 },
    )
  }
}
