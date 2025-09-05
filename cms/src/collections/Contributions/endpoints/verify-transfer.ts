import { addDataAndFileToRequest, PayloadRequest } from 'payload'

export const verifyTransfer = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)
    const { reference } = req.data || {}

    // Validate required fields
    if (!reference) {
      return Response.json(
        {
          success: false,
          message: 'Reference is required',
        },
        { status: 400 },
      )
    }

    const foundContribution = await req.payload.find({
      collection: 'contributions',
      where: {
        transactionReference: reference,
      },
      limit: 1,
    })

    if (foundContribution.docs.length === 0) {
      await req.payload.update({
        collection: 'contributions',
        id: foundContribution.docs[0].id,
        data: {
          isTransferred: true,
        },
      })
    }

    return Response.json({
      success: true,
      data: foundContribution.docs[0],
      message: 'Transfer verified successfully',
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: 'Failed to verify transfer',
        error: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
}
