import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'

/**
 * POST /api/transactions/initialize-paystack-payment
 *
 * Creates a pending transaction record then initialises a Paystack payment.
 * Returns { authorization_url, reference, transactionId } to the client.
 * The client redirects to authorization_url. After payment Paystack redirects
 * to /pay/callback?reference=xxx which verifies and marks the transaction.
 */
export const initializePaystackPayment = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const {
      jarId,
      contributorName,
      contributorEmail,
      contributorPhoneNumber,
      amount,
      collector,
      remarks,
      customFieldValues,
      channels,
    } = req.data || {}

    if (!jarId || !contributorName || !amount || !contributorPhoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'jarId, contributorName, contributorPhoneNumber and amount are required',
        },
        { status: 400 },
      )
    }

    if (amount <= 0) {
      return Response.json(
        { success: false, message: 'Amount must be greater than 0' },
        { status: 400 },
      )
    }

    const settings = await req.payload.findGlobal({ slug: 'system-settings', overrideAccess: true })
    const minimumContributionAmount = (settings as any)?.minimumContributionAmount ?? 2
    if (amount < minimumContributionAmount) {
      return Response.json(
        {
          success: false,
          message: `Minimum contribution amount is GHS ${minimumContributionAmount}`,
        },
        { status: 400 },
      )
    }

    const jar = await req.payload.findByID({ collection: 'jars', id: jarId })

    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    // Resolve email: use contributor's if provided, otherwise fall back to collector/creator email
    let emailToUse = contributorEmail as string | undefined
    if (!emailToUse) {
      const effectiveCollectorId =
        collector || (typeof jar.creator === 'object' ? (jar.creator as any)?.id : jar.creator)
      if (effectiveCollectorId) {
        const collectorUser = await req.payload.findByID({
          collection: 'users',
          id: effectiveCollectorId,
          overrideAccess: true,
        })
        emailToUse = (collectorUser as any)?.email || undefined
      }
    }

    if (!emailToUse) {
      return Response.json(
        {
          success: false,
          message: 'No email available for this transaction. Please provide your email.',
        },
        { status: 400 },
      )
    }

    if (jar.status === 'frozen') {
      return Response.json(
        { success: false, message: 'This jar is currently frozen and cannot accept contributions' },
        { status: 403 },
      )
    }

    // Validate required custom fields
    const jarCustomFields = (jar.customFields as any[]) || []
    for (const field of jarCustomFields) {
      if (field.required) {
        const value = customFieldValues?.[field.id]
        if (value === undefined || value === null || value === '') {
          return Response.json(
            { success: false, message: `"${field.label}" is required` },
            { status: 400 },
          )
        }
      }
    }

    // Create pending transaction record
    const transaction = await req.payload.create({
      collection: 'transactions',
      data: {
        jar: jarId,
        contributor: contributorName,
        contributorEmail: emailToUse,
        contributorPhoneNumber,
        // paymentMethod is set by the webhook once the customer completes payment
        amountContributed: amount,
        paymentStatus: 'pending',
        type: 'contribution',
        collector: collector || jar.creator,
        viaPaymentLink: true,
        ...(remarks ? { remarks } : {}),
        ...(customFieldValues
          ? {
              customFieldValues: jarCustomFields
                .filter((f: any) => customFieldValues[f.id] !== undefined)
                .map((f: any) => ({
                  fieldId: f.id,
                  label: f.label,
                  value: customFieldValues[f.id],
                })),
            }
          : {}),
      },
      overrideAccess: true,
    })

    // Store transaction id as the reference so we can look it up on callback
    await req.payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: { transactionReference: transaction.id },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    // Amount in smallest currency unit (pesewas for GHS, kobo for NGN — both × 100)
    const currency = (jar.currency as string) || 'GHS'
    const amountInPesewas = Math.round(amount * 100)

    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || ''
    const callbackUrl = `${baseUrl}/pay/callback`

    const paystack = getPaystack()
    const paystackRes = await paystack.initializeTransaction({
      email: emailToUse,
      phone: contributorPhoneNumber,
      amount: amountInPesewas,
      currency,
      reference: transaction.id,
      callback_url: callbackUrl,
      channels: (channels as string[] | undefined) ?? [
        'mobile_money',
        'card',
        'bank_transfer',
        'apple_pay',
      ],
      metadata: {
        transactionId: transaction.id,
        jarId,
        contributorName,
        contributorPhoneNumber,
        jarName: jar.name,
        cancel_action: callbackUrl,
      },
    })

    return Response.json({
      success: true,
      data: {
        authorization_url: paystackRes.authorization_url,
        access_code: paystackRes.access_code,
        reference: paystackRes.reference,
        transactionId: transaction.id,
      },
    })
  } catch (error: any) {
    console.error('initializePaystackPayment error:', error)
    return Response.json(
      { success: false, message: error.message || 'Failed to initialize payment' },
      { status: 500 },
    )
  }
}
