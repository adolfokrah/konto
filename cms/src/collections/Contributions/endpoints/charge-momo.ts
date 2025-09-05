import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { paystack } from '@/payload.config'

// Paystack mobile money response data structure based on documentation
interface PaystackChargeResponseData {
  id?: number | string
  reference?: string
  status?: 'success' | 'failed' | 'pending' | 'pay_offline' | 'send_otp'
  display_text?: string
  amount?: number
  currency?: string
  gateway_response?: string
  message?: string
  created_at?: string
  transaction_date?: string
  channel?: string
  domain?: string
  paid_at?: string
}

export const chargeMomo = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    const { contributionId } = req.data || {}

    // Validate required fields
    if (!contributionId) {
      return Response.json(
        {
          success: false,
          message: 'Contribution ID is required',
        },
        { status: 400 },
      )
    }

    // Fetch the contribution
    const contribution = await req.payload.findByID({
      collection: 'contributions',
      id: contributionId,
    })

    if (!contribution) {
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
    }

    // Check if contribution uses mobile money payment method
    if (contribution.paymentMethod !== 'mobile-money') {
      return Response.json(
        {
          success: false,
          message: 'Contribution is not a mobile money payment',
        },
        { status: 400 },
      )
    }

    // Check if contribution is already processed or failed
    if (contribution.paymentStatus === 'completed') {
      return Response.json(
        {
          success: false,
          message: 'Contribution has already been processed successfully',
        },
        { status: 400 },
      )
    }

    // Fetch the jar details
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: typeof contribution.jar === 'object' ? contribution.jar.id : contribution.jar,
    })

    if (!jar) {
      return Response.json(
        {
          success: false,
          message: 'Associated jar not found',
        },
        { status: 404 },
      )
    }

    // Validate mobile money specific fields
    if (!contribution.contributorPhoneNumber) {
      return Response.json(
        {
          success: false,
          message: 'Contributor phone number is required for mobile money payment',
        },
        { status: 400 },
      )
    }

    if (!contribution.mobileMoneyProvider) {
      return Response.json(
        {
          success: false,
          message: 'Mobile money provider is required',
        },
        { status: 400 },
      )
    }

    // Get collector email (from authenticated user or contribution collector)
    const collectorEmail = req.user?.email || ''
    if (!collectorEmail) {
      return Response.json(
        {
          success: false,
          message: 'Collector email not found',
        },
        { status: 400 },
      )
    }

    // Validate charges breakdown
    if (!contribution.chargesBreakdown?.amountPaidByContributor) {
      return Response.json(
        {
          success: false,
          message: 'Contribution amount not found',
        },
        { status: 400 },
      )
    }

    if (!contribution.chargesBreakdown?.platformCharge) {
      return Response.json(
        {
          success: false,
          message: 'Platform charge not found',
        },
        { status: 400 },
      )
    }

    // Prepare charge request data
    const chargeData = {
      email: collectorEmail,
      amount: Number(
        Number(contribution.chargesBreakdown.amountPaidByContributor * 100).toFixed(2),
      ), // Convert to subunits (pesewas/cents)
      currency: jar.currency as 'GHS' | 'KES',
      phone: contribution.contributorPhoneNumber,
      provider: contribution.mobileMoneyProvider,
      reference: contribution.id,
      metadata: {
        description: `Charge contribution for jar: ${jar.name} by collector: ${req.user?.fullName}`,
        contributionId: contribution.id,
        jarId: jar.id,
        contributorPhone: contribution.contributorPhoneNumber,
      },
      subaccount: req.user?.paystackSubAccountCode, // User’s withdrawal MoMo account
      bearer: 'subaccount',
      transaction_charge: contribution.chargesBreakdown.platformCharge * 100,
    }

    console.log(chargeData, process.env.PAYSTACK_SECRET)

    // Charge mobile money via Paystack
    const chargeResult = await paystack.chargeMomo(chargeData)

    if (!chargeResult.status) {
      // Update contribution status to failed
      await req.payload.update({
        collection: 'contributions',
        id: contribution.id,
        data: {
          paymentStatus: 'failed',
        },
      })

      return Response.json(
        {
          success: false,
          message: 'Mobile money charge failed',
          error: chargeResult.message || 'Payment processing failed',
          data: chargeResult.data,
        },
        { status: 400 },
      )
    }

    // Extract charge response data with proper typing for mobile money response
    // Note: MTN, ATL return 'pay_offline' status requiring user authorization on mobile device
    // Vodafone returns 'send_otp' requiring voucher code generation via USSD
    const chargeResponseData = chargeResult.data as PaystackChargeResponseData
    const reference = chargeResponseData?.reference || null

    // Update contribution status and add charge data
    await req.payload.update({
      collection: 'contributions',
      id: contributionId,
      data: {
        transactionReference: reference,
      },
    })

    // Return structured response based on Paystack mobile money response format
    return Response.json({
      success: true,
      message: 'Mobile money charge initiated successfully',
      data: { ...chargeResponseData, reference },
    })
  } catch (error: any) {
    // Log error in development only
    // if (process.env.NODE_ENV !== 'production') {

    console.error('💥 Mobile money charge error:', error)

    // throw new Error(error)
    // }

    // Handle specific errors
    if (error?.status === 404 || error?.name === 'NotFound') {
      return Response.json(
        {
          success: false,
          message: 'Contribution not found',
        },
        { status: 404 },
      )
    }

    return Response.json(
      {
        success: false,
        message: 'An error occurred while processing the mobile money charge',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
