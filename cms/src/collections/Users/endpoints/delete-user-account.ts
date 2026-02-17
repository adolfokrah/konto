import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import type { Payload } from 'payload'

// Function to remove a user from all jar invitations
const removeUserFromJarInvitations = async (payload: Payload, userId: string) => {
  try {
    // Get all jars where this user is invited
    const jarsWithUser = await payload.find({
      collection: 'jars',
      where: {
        'invitedCollectors.collector': {
          equals: userId,
        },
      },
      limit: 1000, // Adjust based on your needs
    })

    // Update each jar to remove the deleted user from invitations
    for (const jar of jarsWithUser.docs) {
      if (jar.invitedCollectors && jar.invitedCollectors.length > 0) {
        // Filter out the deleted user from invited collectors
        const updatedCollectors = jar.invitedCollectors.filter((invitedCollector) => {
          const collectorId =
            typeof invitedCollector.collector === 'string'
              ? invitedCollector.collector
              : invitedCollector.collector?.id
          return collectorId !== userId
        })

        // Update the jar with the filtered list
        await payload.update({
          collection: 'jars',
          id: jar.id,
          data: {
            invitedCollectors: updatedCollectors,
          },
        })

        console.log(`Removed user ${userId} from jar ${jar.id} invitations`)
      }
    }
  } catch (error) {
    console.error('Error removing user from jar invitations:', error)
    // Don't throw the error to avoid blocking account deletion
  }
}

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

    // Check if user has any jars with balance > 0
    const jarsWithBalance = await req.payload.find({
      collection: 'jars',
      where: {
        and: [
          {
            creator: {
              equals: req.user.id,
            },
          },
          {
            totalContributions: {
              greater_than: 0,
            },
          },
        ],
      },
      limit: 1, // We only need to know if at least one exists
    })

    if (jarsWithBalance.docs.length > 0) {
      return Response.json(
        {
          success: false,
          message:
            'Cannot delete account. You have jars with remaining balance. Please withdraw all funds before deleting your account.',
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

    // Remove user from all jar invitations before deleting the account
    await removeUserFromJarInvitations(req.payload, req.user.id)

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
