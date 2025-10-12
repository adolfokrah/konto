import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const deleteUserAccount = async (req: PayloadRequest) => {
  try {
    // Use Payload's helper function to add data to the request
    await addDataAndFileToRequest(req)
    if (!req.user) {
      return Response.json(
        {
          success: false,
          message: 'Authentication required',
        },
        { status: 401 },
      )
    }

    const { reason } = req.data || {}

    if (!reason) {
      return Response.json(
        {
          success: false,
          message: 'Reason for deletion is required',
        },
        { status: 400 },
      )
    }

    // Store deleted user account details in a separate collection
    await req.payload.create({
      collection: 'deletedUserAccounts',
      data: {
        email: req.user.email,
        deletionReason: reason,
      },
    })

    // Delete the user account
    await req.payload.delete({
      collection: 'users',
      id: req.user.id,
    })

    return Response.json(
      {
        success: true,
        message: 'User account deleted successfully',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error processing request data:', error)
    return Response.json(
      {
        success: false,
        message: 'Error processing request data',
      },
      { status: 500 },
    )
  }
}
