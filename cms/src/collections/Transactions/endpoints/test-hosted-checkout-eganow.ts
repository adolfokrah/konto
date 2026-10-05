import { addDataAndFileToRequest, PayloadRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'

const EGANOW_BASE_URL = 'https://developer.deveganowapi.com'

/**
 * Debug endpoint: sends a hosted checkout request to Eganow and returns Eganow's raw
 * status and body untouched, so we can see exactly what their API answers.
 * Any field in the request body overrides the default payload below.
 */
export const testHostedCheckoutEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    const reference = req.data?.merchantReference || `TEST-${Date.now()}`
    const payload = {
      accountName: 'Test Payer',
      amount: '1',
      callback: 'https://hogapay.com/api/transactions/eganow-webhook',
      currencyIso: 'GHS',
      merchantDisplayName: 'Hogapay',
      merchantlogourl: 'https://hogapay.com/logo.png',
      merchantReference: reference,
      senderCountryCode: 'GH0233',
      redirectUrl: `https://hogapay.com/pay/return/${reference}`,
      ...(req.data || {}),
    }

    const baseUrl = (process.env.EGANOW_HOSTED_CHECKOUT_BASE_URL || EGANOW_BASE_URL).replace(
      /\/+$/,
      '',
    )
    const url = `${baseUrl}/api/hosted-checkout/paymentRequest`
    const token = await getEganow().getToken()

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-Auth': process.env.EGANOW_X_AUTH_TOKEN!,
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let body: unknown = text
    try {
      body = JSON.parse(text)
    } catch {
      // Not JSON; return the raw text as-is.
    }

    return Response.json({
      url,
      sentPayload: payload,
      eganowStatus: response.status,
      eganowResponse: body,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    )
  }
}
