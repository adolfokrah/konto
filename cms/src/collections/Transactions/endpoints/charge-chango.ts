import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { getChango } from '@/utilities/initalise'
import type { ChangoChannelId, ChangoPaymentMethod } from '@/utilities/chango'

const PROVIDER_TO_CHANNEL: Record<string, ChangoChannelId> = {
  mtn: 'MTN',
  telecel: 'VOD',
  vodafone: 'VOD',
  airteltigo: 'AIRTELTIGO',
}

function toInternationalMsisdn(raw: string): string {
  const trimmed = raw.replace(/\s+/g, '').replace(/^\+/, '')
  if (trimmed.startsWith('233')) return `+${trimmed}`
  if (trimmed.startsWith('0')) return `+233${trimmed.substring(1)}`
  return `+233${trimmed}`
}

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

    const campaignId = (jar as any).changoCampaignId
    if (!campaignId) {
      return Response.json(
        {
          success: false,
          message: 'Jar is not linked to a Chango campaign yet — try again shortly',
        },
        { status: 409 },
      )
    }

    let paymentMethod: ChangoPaymentMethod
    let channelId: ChangoChannelId

    if (contribution.paymentMethod === 'mobile-money') {
      paymentMethod = 'mobile_money'
      if (!contribution.contributorPhoneNumber) {
        return Response.json(
          {
            success: false,
            message: 'Contributor phone number is required for mobile money payment',
          },
          { status: 400 },
        )
      }
      const provider = (contribution.mobileMoneyProvider ?? '').toLowerCase()
      const mapped = PROVIDER_TO_CHANNEL[provider]
      if (!mapped) {
        return Response.json(
          { success: false, message: `Unsupported mobile money provider: ${provider}` },
          { status: 400 },
        )
      }
      channelId = mapped
    } else if (contribution.paymentMethod === 'card') {
      paymentMethod = 'card'
      channelId = 'MTN'
    } else {
      return Response.json(
        {
          success: false,
          message: `Payment method ${contribution.paymentMethod} not supported by Chango`,
        },
        { status: 400 },
      )
    }

    const amountValue = contribution.amountContributed
    if (!amountValue || amountValue <= 0) {
      return Response.json(
        { success: false, message: 'Contribution amount not found' },
        { status: 400 },
      )
    }

    const msisdn = contribution.contributorPhoneNumber
      ? toInternationalMsisdn(contribution.contributorPhoneNumber)
      : ''

    const fullName = (contribution.contributor as string) || 'Anonymous'
    const email = (contribution as any).contributorEmail
    if (!email) {
      return Response.json(
        { success: false, message: 'Contributor email is required' },
        { status: 400 },
      )
    }

    const chango = getChango()
    const request = {
      campaignId,
      amount: String(amountValue),
      currency: (jar.currency as string) ?? 'GHS',
      narration: `Contribution for jar ${jar.name}`,
      channelId,
      paymentMethod,
      msisdn,
      fullName,
      email,
      pageTitle: jar.name ?? 'Konto Jar',
      pageDescription: 'Contribution',
      timeout: 300,
      logo: process.env.CHANGO_LOGO_URL ?? 'https://hogapay.com/api/media/file/Group%2082.png',
      successRedirectUrl: process.env.CHANGO_SUCCESS_REDIRECT_URL,
      failureRedirectUrl: process.env.CHANGO_FAILURE_REDIRECT_URL,
    }
    console.log('[Chango] createTransaction request:', JSON.stringify(request, null, 2))
    const res = await chango.createTransaction(request)
    console.log('[Chango] createTransaction response:', JSON.stringify(res, null, 2))

    const data = res?.data
    if (!data?.success || !data.checkoutUrl) {
      return Response.json(
        {
          success: false,
          message: res?.response_message || 'Chango did not return a checkout URL',
          raw: res,
        },
        { status: 502 },
      )
    }

    await req.payload.update({
      collection: 'transactions',
      id: contributionId,
      data: {
        transactionReference: data.checkoutTransactionReference,
        changoInvoiceId: data.invoiceId,
        changoCheckoutUrl: data.checkoutUrl,
        paymentStatus: 'pending',
      } as any,
      context: { skipCharges: true } as any,
    })

    return Response.json({
      success: true,
      message: 'Chango payment initiated successfully',
      data: {
        status: 'pay_offline',
        reference: data.checkoutTransactionReference,
        transactionReference: data.checkoutTransactionReference,
        invoiceId: data.invoiceId,
        checkoutUrl: data.checkoutUrl,
        contributionId: contribution.id,
      },
    })
  } catch (error: any) {
    if (error?.status === 404 || error?.name === 'NotFound') {
      return Response.json({ success: false, message: 'Contribution not found' }, { status: 404 })
    }

    return Response.json(
      {
        success: false,
        message: 'An error occurred while initiating the Chango payment',
        error: error?.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
