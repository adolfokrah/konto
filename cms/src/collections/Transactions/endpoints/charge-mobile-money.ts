import { addDataAndFileToRequest, PayloadRequest } from 'payload'
import { getPaystack } from '@/utilities/initalise'
import { getCharges } from '@/utilities/getCharges'

/**
 * POST /api/transactions/charge-mobile-money
 *
 * Directly charges a Ghana mobile money number via Paystack /charge.
 * No WebView or redirect needed — the customer gets a USSD push or OTP on their phone.
 *
 * Body: { jarId, contributorName, contributorPhoneNumber, amount, provider, collector?, customFieldValues? }
 * provider: 'mtn' | 'vod' | 'atl'
 */
export const chargeMobileMoney = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const {
      jarId,
      contributorName,
      contributorPhoneNumber,
      amount,
      provider,
      collector,
      remarks,
      customFieldValues,
    } = req.data || {}

    if (!jarId || !contributorName || !amount || !contributorPhoneNumber || !provider) {
      return Response.json(
        {
          success: false,
          message:
            'jarId, contributorName, contributorPhoneNumber, amount and provider are required',
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

    const jar = await req.payload.findByID({ collection: 'jars', id: jarId, depth: 1 })
    if (!jar) {
      return Response.json({ success: false, message: 'Jar not found' }, { status: 404 })
    }

    if (jar.status === 'frozen') {
      return Response.json(
        { success: false, message: 'This jar is currently frozen and cannot accept contributions' },
        { status: 403 },
      )
    }

    // Resolve email from collector/creator
    const effectiveCollectorId =
      collector || (typeof jar.creator === 'object' ? (jar.creator as any)?.id : jar.creator)
    let emailToUse: string | undefined
    if (effectiveCollectorId) {
      const collectorUser = await req.payload.findByID({
        collection: 'users',
        id: effectiveCollectorId,
        overrideAccess: true,
      })
      emailToUse = (collectorUser as any)?.email || undefined
    }

    if (!emailToUse) {
      return Response.json(
        { success: false, message: 'No email available for this transaction.' },
        { status: 400 },
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

    const feePaidBy = ((jar.collectionFeePaidBy as string) || 'contributor') as
      | 'contributor'
      | 'jar-creator'
    const creatorCountry: string | undefined = (
      typeof jar.creator === 'object' ? (jar.creator as any)?.country : undefined
    )
      ?.toLowerCase()
      .trim()
    const charges = await getCharges(req.payload, {
      amount,
      type: 'contribution',
      collectionFeePaidBy: feePaidBy,
      paymentMethod: 'mobile-money',
      country: creatorCountry,
    })

    // Create pending transaction record with charges already calculated
    const transaction = await req.payload.create({
      collection: 'transactions',
      data: {
        jar: jarId,
        contributor: contributorName,
        contributorEmail: emailToUse,
        contributorPhoneNumber,
        amountContributed: amount,
        paymentStatus: 'pending',
        type: 'contribution',
        paymentMethod: 'mobile-money',
        mobileMoneyProvider: provider,
        collector: collector || jar.creator,
        viaPaymentLink: false,
        collectionFeePaidBy: feePaidBy,
        chargesBreakdown: {
          platformCharge: charges.processingFee,
          amountPaidByContributor:
            feePaidBy === 'contributor'
              ? charges.initialAmount + charges.processingFee
              : charges.initialAmount,
          hogapayRevenue: charges.hogapayRevenue,
          eganowFees: charges.eganowFees,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: charges.netAmount,
          collectionFeePercent: 0,
        },
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
      context: { skipCharges: true },
    })

    await req.payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: { transactionReference: transaction.id },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    const amountToCharge =
      feePaidBy === 'contributor'
        ? charges.initialAmount + charges.processingFee
        : charges.initialAmount

    const normalizedPhone = contributorPhoneNumber

    const amountInPesewas = Math.round(amountToCharge * 100)
    const currency = (jar.currency as string) || 'GHS'

    const paystack = getPaystack()
    const chargeRes = await paystack.charge({
      email: emailToUse,
      amount: amountInPesewas,
      currency,
      reference: transaction.id,
      mobile_money: {
        phone: normalizedPhone,
        provider: provider as 'mtn' | 'vod' | 'atl' | 'tgo',
      },
      metadata: {
        transactionId: transaction.id,
        jarId,
        contributorName,
        jarName: jar.name,
      },
    })

    console.log(
      '[charge-mobile-money] Paystack response:',
      JSON.stringify({ phone: normalizedPhone, provider, ...chargeRes }, null, 2),
    )

    return Response.json({
      success: true,
      data: {
        status: chargeRes.status,
        reference: chargeRes.reference,
        transactionId: transaction.id,
        displayText: chargeRes.display_text,
      },
    })
  } catch (error: any) {
    console.error('[charge-mobile-money] error:', error.message)
    let message = error.message || 'Failed to initiate charge'
    try {
      const match = message.match(/- (\{.+\})$/)
      if (match) {
        const parsed = JSON.parse(match[1])
        console.log('[charge-mobile-money] Paystack error:', JSON.stringify(parsed, null, 2))
        message = parsed.data?.message || parsed.message || message
      }
    } catch {
      /* keep original */
    }
    return Response.json({ success: false, message }, { status: 400 })
  }
}
