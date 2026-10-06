import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'
import { getServerSideURL, getWebhookBaseURL } from '@/utilities/getURL'
import { isCreatorKybApproved, KYB_NOT_APPROVED_MESSAGE } from '@/utilities/kyb'

/** Eganow's country code for Ghana. Only market we collect in today. */
const SENDER_COUNTRY_CODE = 'GH0233'
/** Eganow service and merchant ids that hosted checkout collections run under. */
const HOSTED_CHECKOUT_SERVICE_ID = 'biz-collect'
const HOSTED_CHECKOUT_MERCHANT_SERVICE_ID = 'Hoganam'
/** Payers see Hogapay as the merchant on Eganow's page, whichever jar they pay into. */
const MERCHANT_DISPLAY_NAME = 'Hogapay'
const MERCHANT_LOGO_URL = 'https://hogapay.com/api/media/file/Group%2082.png'

/**
 * Pull the hosted payment page URL out of the response. Eganow returns it as
 * `hostedCheckoutUrl`:
 *   { transactionId, merchantReference, status: "INITIATED", hostedCheckoutUrl }
 * The other spellings are kept in case their card and collection APIs differ.
 */
export function extractCheckoutUrl(response: Record<string, any>): string | null {
  const candidates = [response, response?.data].filter(Boolean)
  for (const source of candidates) {
    for (const key of [
      'hostedCheckoutUrl',
      'redirectUrl',
      'checkoutUrl',
      'paymentUrl',
      'url',
      'RedirectUrl',
    ]) {
      const value = source?.[key]
      if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
        return value.trim()
      }
    }
  }
  return null
}

/** Eganow's own reference for the session, when it returns one. */
export function extractEganowReference(response: Record<string, any>): string | null {
  const candidates = [response, response?.data].filter(Boolean)
  for (const source of candidates) {
    for (const key of ['eganowReferenceNo', 'referenceNo', 'transactionId', 'EganowReferenceNo']) {
      const value = source?.[key]
      if (typeof value === 'string' && value.trim() && value.trim() !== 'N/A') {
        return value.trim()
      }
    }
  }
  return null
}

/**
 * Hosted Checkout collection via Eganow.
 *
 * Creates a checkout session for a pending contribution and returns the URL of Eganow's
 * hosted payment page. The payer enters their card details there, so no card data ever
 * reaches this server. The final status arrives on the collection webhook; the browser
 * comes back to the jar's contribution page, which polls until the status settles.
 */
export const chargeHostedCheckoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { contributionId } = req.data || {}

    if (!contributionId) {
      return Response.json(
        { success: false, message: 'Contribution ID is required' },
        { status: 400 },
      )
    }

    const contribution = await req.payload.findByID({
      collection: 'transactions',
      id: contributionId,
    })

    if (!contribution) {
      return Response.json({ success: false, message: 'Contribution not found' }, { status: 404 })
    }

    if (contribution.paymentStatus === 'completed') {
      return Response.json(
        { success: false, message: 'Contribution has already been processed successfully' },
        { status: 400 },
      )
    }

    const jar = await req.payload.findByID({
      collection: 'jars',
      id: typeof contribution.jar === 'object' ? contribution.jar.id : contribution.jar,
      depth: 0,
    })

    if (!jar) {
      return Response.json({ success: false, message: 'Associated jar not found' }, { status: 404 })
    }

    if (jar.status === 'frozen') {
      return Response.json(
        {
          success: false,
          message: 'This jar is currently frozen and cannot accept contributions',
        },
        { status: 403 },
      )
    }

    if (!(await isCreatorKybApproved(req.payload, jar.creator))) {
      return Response.json({ success: false, message: KYB_NOT_APPROVED_MESSAGE }, { status: 403 })
    }

    if (!contribution.chargesBreakdown?.amountPaidByContributor) {
      return Response.json(
        { success: false, message: 'Contribution amount not found' },
        { status: 400 },
      )
    }

    // Amount after discount: send the reduced amount so Eganow's fee brings the total
    // back to what the contributor was quoted (same logic as mobile money and card).
    const amount = String(
      (contribution.chargesBreakdown as any)?.amountToSendToEganow ??
        contribution.amountContributed ??
        0,
    )

    const checkoutResponse = await getEganow().createHostedCheckout({
      accountName: contribution.contributor || 'Anonymous',
      amount,
      callback: `${getWebhookBaseURL()}/api/transactions/eganow-webhook`,
      currency: jar.currency as string,
      currencyIso: jar.currency as string,
      serviceId: HOSTED_CHECKOUT_SERVICE_ID,
      merchantServiceId: HOSTED_CHECKOUT_MERCHANT_SERVICE_ID,
      merchantDisplayName: MERCHANT_DISPLAY_NAME,
      merchantlogourl: MERCHANT_LOGO_URL,
      // Our contribution id doubles as the reference Eganow echoes back on the callback.
      merchantReference: contribution.id,
      senderCountryCode: SENDER_COUNTRY_CODE,
      // Back to the jar's contribution page, which verifies the payment before congratulating.
      redirectUrl: `${getServerSideURL()}/pay/${jar.id}/${encodeURIComponent(jar.name)}?reference=${contribution.id}`,
    })

    // A rejection can still come back as a body rather than an HTTP error, so check both
    // the envelope flag and the `status` field.
    if (
      checkoutResponse?.isSuccess === false ||
      String((checkoutResponse as any)?.status || '').toUpperCase() === 'REJECTED'
    ) {
      console.error(
        `[hosted-checkout] Eganow rejected the request: ${checkoutResponse.errorMessage || checkoutResponse.message || (checkoutResponse as any).reason}`,
      )
      return Response.json(
        {
          success: false,
          message:
            checkoutResponse.errorMessage ||
            checkoutResponse.message ||
            (checkoutResponse as any).reason ||
            'Card payments are unavailable right now. Please try mobile money.',
        },
        { status: 502 },
      )
    }

    const checkoutUrl = extractCheckoutUrl(checkoutResponse)

    if (!checkoutUrl) {
      console.error(
        '[hosted-checkout] no checkout URL in Eganow response:',
        JSON.stringify(checkoutResponse),
      )
      return Response.json(
        {
          success: false,
          message: checkoutResponse?.message || 'Eganow did not return a checkout URL',
        },
        { status: 502 },
      )
    }

    // `transactionReference` stays the contribution id: it is what we sent as
    // `merchantReference`, what the return page polls with, and what the status API
    // accepts. Eganow's own reference is kept alongside it for reconciliation.
    const eganowReference = extractEganowReference(checkoutResponse)

    await req.payload.update({
      collection: 'transactions',
      id: contributionId,
      data: {
        transactionReference: contribution.id,
        paymentStatus: 'pending',
        ...(eganowReference && { eganowPayPartnerTransactionId: eganowReference }),
      },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    return Response.json({
      success: true,
      message: 'Hosted checkout session created successfully',
      data: {
        checkoutUrl,
        reference: contribution.id,
        contributionId: contribution.id,
        ...(eganowReference && { eganowReferenceNo: eganowReference }),
      },
    })
  } catch (error: any) {
    if (error?.status === 404 || error?.name === 'NotFound') {
      return Response.json({ success: false, message: 'Contribution not found' }, { status: 404 })
    }

    console.error('[hosted-checkout] error:', error?.message)

    return Response.json(
      {
        success: false,
        message: 'An error occurred while creating the hosted checkout session',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
