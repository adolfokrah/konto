import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const createPaymentLinkContribution = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { jarId, contributorName, contributorEmail, amount } = req.data || {}

    // Validate required fields
    if (!jarId || !contributorName || !contributorEmail || !amount) {
      return Response.json(
        {
          success: false,
          message: 'All fields are required: jarId, contributorName, contributorEmail, amount',
        },
        { status: 400 },
      )
    }

    // Validate amount is positive
    if (amount <= 0) {
      return Response.json(
        {
          success: false,
          message: 'Amount must be greater than 0',
        },
        { status: 400 },
      )
    }

    // Check if jar exists
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
    })

    if (!jar) {
      return Response.json(
        {
          success: false,
          message: 'Jar not found',
        },
        { status: 404 },
      )
    }

    // Create the contribution record using admin access
    const contribution = await req.payload.create({
      collection: 'contributions',
      data: {
        jar: jarId,
        contributor: contributorName,
        contributorPhoneNumber: contributorEmail, // Using email field as identifier for anonymous contributions
        paymentMethod: 'mobile-money', // Paystack payment
        mobileMoneyProvider: 'paystack',
        amountContributed: amount,
        paymentStatus: 'pending',
        type: 'contribution',
        collector: jar.creator, // The jar creator is the collector for payment link contributions
        viaPaymentLink: true,
      },
      // Use admin context to bypass authentication requirements
      overrideAccess: true,
    })

    await req.payload.update({
      collection: 'contributions',
      id: contribution.id,
      data: {
        transactionReference: contribution.id,
      },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Contribution created successfully',
      data: contribution,
    })
  } catch (error: any) {
    console.error('Error creating payment link contribution:', error)
    return Response.json(
      {
        success: false,
        message: 'Failed to create contribution',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
