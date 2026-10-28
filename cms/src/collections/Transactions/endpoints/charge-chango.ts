import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getChango } from '@/utilities/initalise'
import { ensureChangoCampaign } from '@/utilities/changoCampaign'
import { ChangoError } from '@/utilities/chango'
import { getServerSideURL } from '@/utilities/getURL'
import { isCreatorVerified, CREATOR_NOT_VERIFIED_MESSAGE } from '@/utilities/kyb'

/** Payers see Hogapay as the merchant on Chango's page, whichever jar they pay into. */
const PAGE_TITLE = 'Hogapay'
const LOGO_URL = 'https://hogapay.com/api/media/file/Group%2082.png'
/** Chango requires an email but the contribution page doesn't ask for one. */
const FALLBACK_EMAIL = 'contributions@hogapay.com'
/** Ghana is the only market we collect in today. */
const COUNTRY_ID = 'GH'

/** 024 123 4567 / +233 24 123 4567 → 233241234567 */
export function toChangoMsisdn(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('233')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return digits
}

/**
 * Hosted checkout via Chango. A jar without a Chango campaign gets one here first.
 *
 * Creates a Chango invoice for a pending contribution and returns the URL of Chango's checkout
 * page. Chango collects and settles the money; we only record the contribution. The payer comes
 * back to the jar's contribution page with `?reference=<contribution id>`, which polls until the
 * status settles.
 */
export const chargeChango = async (req: PayloadRequest) => {
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

    if (!(await isCreatorVerified(req.payload, jar.creator))) {
      return Response.json(
        { success: false, message: CREATOR_NOT_VERIFIED_MESSAGE },
        { status: 403 },
      )
    }

    const amount = Number(contribution.amountContributed)
    if (!amount || amount <= 0) {
      return Response.json(
        { success: false, message: 'Contribution amount not found' },
        { status: 400 },
      )
    }

    // Jars created before Chango get their campaign on their first contribution.
    const campaignId = await ensureChangoCampaign(req.payload, jar)

    const msisdn = toChangoMsisdn(contribution.contributorPhoneNumber || '')
    const contributorName = contribution.contributor || 'Anonymous'
    // Back to the jar's contribution page, which verifies the payment before congratulating.
    const returnUrl = `${getServerSideURL()}/pay/${jar.id}/${encodeURIComponent(jar.name)}?reference=${contribution.id}`

    const payment = await getChango().createPayment({
      groupId: process.env.CHANGO_GROUP_ID!,
      campaignId,
      amount,
      currency: (jar.currency as string) || 'GHS',
      narration: `Contribution to ${jar.name}`.slice(0, 100),
      recurring: false,
      msisdn,
      paymentDestinationNumber: msisdn,
      // No paymentMethod: the payer picks mobile money or card on Chango's page. channelId is
      // still required (WALLET or CARD).
      channelId: 'WALLET',
      // Required but not validated by Chango; confirm the expected value with them.
      destinationCode: 'WALLET',
      platform: 'web',
      countryId: COUNTRY_ID,
      anonymous: contributorName === 'Anonymous',
      pledgeRedemption: false,
      fullName: contributorName,
      name: contributorName,
      email: FALLBACK_EMAIL,
      pageTitle: PAGE_TITLE,
      pageDescription: jar.name,
      logo: LOGO_URL,
      successRedirectUrl: returnUrl,
      failureRedirectUrl: returnUrl,
    })

    if (!payment?.checkoutUrl) {
      console.error('[charge-chango] no checkout URL in Chango response:', JSON.stringify(payment))
      return Response.json(
        { success: false, message: 'Chango did not return a checkout URL' },
        { status: 502 },
      )
    }

    // `transactionReference` stays the contribution id: it is what the return page polls with.
    await req.payload.update({
      collection: 'transactions',
      id: contributionId,
      data: {
        transactionReference: contribution.id,
        paymentStatus: 'pending',
        changoInvoiceId: payment.invoiceId,
        changoCheckoutReference: payment.checkoutTransactionReference,
        // Hogapay charges nothing on Chango collections, even if the jar got its campaign
        // only just now and fees were worked out when the contribution was created.
        chargesBreakdown: {
          platformCharge: 0,
          amountPaidByContributor: amount,
          hogapayRevenue: 0,
          eganowFees: 0,
          discountPercent: 0,
          discountAmount: 0,
          amountToSendToEganow: amount,
          collectionFeePercent: 0,
          feeSource: 'chango',
        },
      },
      overrideAccess: true,
      context: { skipCharges: true },
    })

    return Response.json({
      success: true,
      message: 'Chango checkout session created successfully',
      data: {
        checkoutUrl: payment.checkoutUrl,
        reference: contribution.id,
        contributionId: contribution.id,
      },
    })
  } catch (error: any) {
    if (error?.status === 404 || error?.name === 'NotFound') {
      return Response.json({ success: false, message: 'Contribution not found' }, { status: 404 })
    }

    console.error('[charge-chango] error:', error?.message)

    if (error instanceof ChangoError) {
      return Response.json(
        { success: false, message: 'Payments are unavailable right now. Please try again.' },
        { status: 502 },
      )
    }

    return Response.json(
      {
        success: false,
        message: 'An error occurred while creating the checkout session',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
