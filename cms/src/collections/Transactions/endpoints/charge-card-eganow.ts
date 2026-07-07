import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getEganow } from '@/utilities/initalise'
import { sanitizeNarration } from '@/utilities/eganow'
import { getWebhookBaseURL } from '@/utilities/getURL'
import { isCreatorKybApproved, KYB_NOT_APPROVED_MESSAGE } from '@/utilities/kyb'

/**
 * Card Collection via Eganow.
 *
 * SECURITY (PCI DSS): the card number, expiry and CVV are handled in-transit only.
 * They are NEVER logged and NEVER persisted to the database. Do not add logging of
 * `req.data` or the collection request body in this handler.
 */
export const chargeCardEganow = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { contributionId, cardNumber, expiryMonth, expiryYear, cvv, cardHolderName } =
      req.data || {}

    if (!contributionId) {
      return Response.json(
        { success: false, message: 'Contribution ID is required' },
        { status: 400 },
      )
    }

    if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
      return Response.json(
        { success: false, message: 'Card number, expiry and CVV are required' },
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

    if (contribution.paymentMethod !== 'card') {
      return Response.json(
        { success: false, message: 'Contribution is not a card payment' },
        { status: 400 },
      )
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

    // Amount after discount: send reduced amount so Eganow's fee brings the total
    // back to what the contributor pays (same logic as mobile money).
    const amount = String(
      (contribution.chargesBreakdown as any)?.amountToSendToEganow ??
        contribution.amountContributed ??
        0,
    )

    const collectionResult = await getEganow().collectCard({
      paypartnerCode: 'CARDGATEWAY',
      amount,
      accountNoOrCardNoOrMSISDN: String(cardNumber).replace(/\s+/g, ''),
      accountName: cardHolderName || contribution.contributor || 'Anonymous',
      transactionId: contribution.id,
      narration: sanitizeNarration(`Contribution for jar ${jar.name}`),
      transCurrencyIso: jar.currency as string,
      expiryDateMonth: Number(expiryMonth),
      expiryDateYear: Number(expiryYear),
      cvv: String(cvv),
      languageId: 'en',
      callback: `${getWebhookBaseURL()}/api/transactions/eganow-card-webhook`,
    })

    // Map Eganow transaction status to the format the payment page expects.
    const statusMap: { [key: string]: string } = {
      Pending: 'pending',
      PENDING: 'pending',
      Successful: 'success',
      SUCCESSFUL: 'success',
      Approved: 'success',
      APPROVED: 'success',
      Failed: 'failed',
      FAILED: 'failed',
      AUTHENTICATION_IN_PROGRESS: 'authentication_in_progress',
      EXPIRED: 'failed',
      CANCELLED: 'failed',
    }

    const mappedStatus = statusMap[collectionResult.transactionStatus] || 'pending'

    // Eganow returns the 3D Secure challenge as an HTML document in `redirectUrl`.
    // A frictionless / already-authorised payment returns "N/A" (or empty) — no challenge.
    // Per Eganow docs the challenge HTML may be base64-encoded (prod) or raw (sandbox),
    // so decode when it doesn't already look like HTML.
    const rawRedirect = (
      collectionResult.redirectUrl ||
      (collectionResult as any).redirectHtml ||
      ''
    )
      .toString()
      .trim()

    let challengeHtml: string | undefined
    if (rawRedirect && rawRedirect !== 'N/A') {
      if (rawRedirect.includes('<')) {
        challengeHtml = rawRedirect
      } else {
        // Try base64 → HTML
        try {
          const decoded = Buffer.from(rawRedirect, 'base64').toString('utf8')
          if (decoded.includes('<')) challengeHtml = decoded
        } catch {
          // not valid base64 — leave undefined
        }
      }
    }

    // Safe diagnostic (no card data): status + whether a challenge was returned
    console.log(
      `[charge-card] status=${collectionResult.transactionStatus} isSuccess=${collectionResult.isSuccess} challenge=${challengeHtml ? 'yes' : 'no'} ref=${collectionResult.eganowReferenceNo}`,
    )

    // When there is NO 3DS challenge, the collectCard response is already terminal
    // (frictionless auth), so reflect it immediately — otherwise the payment would sit
    // pending forever (the challenge page's callback fetch never fires without a challenge).
    // With a challenge, stay pending until the card webhook / polling finalises it.
    const paymentStatus: 'pending' | 'completed' | 'failed' = challengeHtml
      ? 'pending'
      : mappedStatus === 'success'
        ? 'completed'
        : mappedStatus === 'failed'
          ? 'failed'
          : 'pending'

    await req.payload.update({
      collection: 'transactions',
      id: contributionId,
      data: {
        transactionReference: collectionResult.eganowReferenceNo,
        paymentStatus,
      },
      context: { skipCharges: true },
    })

    return Response.json({
      success: true,
      message: 'Card charge initiated successfully via Eganow',
      data: {
        status: mappedStatus,
        reference: collectionResult.eganowReferenceNo,
        eganowReferenceNo: collectionResult.eganowReferenceNo,
        message: collectionResult.message,
        contributionId: contribution.id,
        // 3D Secure challenge HTML to render for the payer (only when a real challenge exists)
        ...(challengeHtml && { redirectHtml: challengeHtml }),
      },
    })
  } catch (error: any) {
    if (error?.status === 404 || error?.name === 'NotFound') {
      return Response.json({ success: false, message: 'Contribution not found' }, { status: 404 })
    }

    return Response.json(
      {
        success: false,
        message: 'An error occurred while processing the card charge via Eganow',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
