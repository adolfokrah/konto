import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

/**
 * POST /api/transactions/submit-charge-otp
 *
 * Submits an OTP or birthday for a pending Paystack direct charge.
 * Body: { reference, otp } OR { reference, birthday } (YYYY-MM-DD)
 */
export const submitChargeOtp = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const { reference, otp, birthday } = req.data || {}

    if (!reference || (!otp && !birthday)) {
      return Response.json(
        { success: false, message: 'reference and either otp or birthday are required' },
        { status: 400 },
      )
    }

    const paystack = getPaystack()
    const result = otp
      ? await paystack.submitOtp(reference, otp)
      : await paystack.submitBirthday(reference, birthday)

    return Response.json({
      success: true,
      data: {
        status: result.status,
        reference: result.reference,
        displayText: result.display_text,
      },
    })
  } catch (error: any) {
    console.log('[submit-charge-otp] error:', error.message)
    // Extract the actual Paystack message from the error string
    let message = error.message || 'Failed to submit'
    try {
      const match = message.match(/- (\{.+\})$/)
      if (match) {
        const parsed = JSON.parse(match[1])
        console.log('[submit-charge-otp] Paystack error:', JSON.stringify(parsed, null, 2))
        message = parsed.message || message
      }
    } catch {
      /* keep original */
    }
    return Response.json({ success: false, message }, { status: 400 })
  }
}
