import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { eganow } from '@/utilities/initalise'

// Eganow mobile money response data structure based on documentation
interface EganowChargeResponseData {
  transactionStatus: string
  eganowReferenceNo: string
  message: string
}

export const chargeMomoEganow = async (req: PayloadRequest) => {
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

    // Map mobile money provider to Eganow paypartner code
    const providerMap: Record<string, string> = {
      mtn: 'MTNGH',
      airteltigo: 'ATGH',
      telecel: 'TCELGH',
    }

    const paypartnerCode = providerMap[contribution.mobileMoneyProvider.toLowerCase()]
    if (!paypartnerCode) {
      return Response.json(
        {
          success: false,
          message: 'Unsupported mobile money provider for Eganow',
        },
        { status: 400 },
      )
    }

    // Format phone number to international format (233...)
    let phoneNumber = contribution.contributorPhoneNumber.replace(/\s+/g, '')
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '233' + phoneNumber.substring(1)
    } else if (!phoneNumber.startsWith('233')) {
      phoneNumber = '233' + phoneNumber
    }

    // Get token (automatically cached by Eganow class)
    await eganow.getToken()

    // Prepare collection request data
    const collectionData = {
      paypartnerCode,
      amount: String(contribution.chargesBreakdown.amountPaidByContributor), // Amount as string
      accountNoOrCardNoOrMSISDN: phoneNumber,
      accountName: contribution.contributor || 'Anonymous',
      transactionId: contribution.id, // Use contribution ID as transaction reference
      narration: `Contribution for jar: ${jar.name}`,
      transCurrencyIso: jar.currency as string,
      expiryDateMonth: 0,
      expiryDateYear: 0,
      cvv: '',
      languageId: 'en',
      callback: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/contributions/eganow-webhook`, // Webhook endpoint
    }

    // Initiate mobile money collection via Eganow
    const collectionResult = await eganow.collectMobileMoney(collectionData)

    // Map Eganow transaction status to mobile app expected format
    const statusMap: { [key: string]: string } = {
      Pending: 'pay_offline',
      PENDING: 'pay_offline',
      Successful: 'success',
      SUCCESSFUL: 'success',
      Failed: 'failed',
      FAILED: 'failed',
    }

    const mappedStatus = statusMap[collectionResult.transactionStatus] || 'pay_offline' // Default to pay_offline for unknown statuses

    // Update contribution status and add charge data
    await req.payload.update({
      collection: 'contributions',
      id: contributionId,
      data: {
        transactionReference: collectionResult.eganowReferenceNo,
        paymentStatus: 'pending', // Set to pending while waiting for user approval
      },
    })

    // Return structured response based on Eganow mobile money response format
    return Response.json({
      success: true,
      message: 'Mobile money charge initiated successfully via Eganow',
      data: {
        status: mappedStatus, // Use mapped status for mobile app
        reference: collectionResult.eganowReferenceNo, // Add reference field for mobile app
        eganowReferenceNo: collectionResult.eganowReferenceNo,
        message: collectionResult.message,
        contributionId: contribution.id,
      },
    })
  } catch (error: any) {
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
        message: 'An error occurred while processing the mobile money charge via Eganow',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
