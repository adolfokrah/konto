import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { promoteUserToAdmin, demoteAdminToUser } from '../../../utilities/user-role-management'

/**
 * Endpoint to manage user roles - promote to admin or demote to user
 * Only accessible by existing admin users
 *
 * POST /api/users/manage-role
 * Body: {
 *   action: 'promote' | 'demote',
 *   userIdentifier: string (email or phone),
 *   identifierType?: 'email' | 'phoneNumber' (defaults to 'email')
 * }
 */
export const manageUserRole = async (req: PayloadRequest): Promise<Response> => {
  try {
    // Parse request data
    await addDataAndFileToRequest(req)
    const { action, userIdentifier, identifierType = 'email' } = req.data || {}
    const { user } = req

    // Check if requesting user is admin
    if (!user || user.role !== 'admin') {
      return Response.json(
        {
          success: false,
          message: 'Access denied. Only admin users can manage roles.',
        },
        { status: 403 },
      )
    }

    // Validate input
    if (!action || !userIdentifier) {
      return Response.json(
        {
          success: false,
          message: 'Both action and userIdentifier are required',
        },
        { status: 400 },
      )
    }

    if (!['promote', 'demote'].includes(action)) {
      return Response.json(
        {
          success: false,
          message: 'Action must be either "promote" or "demote"',
        },
        { status: 400 },
      )
    }

    if (!['email', 'phoneNumber'].includes(identifierType)) {
      return Response.json(
        {
          success: false,
          message: 'identifierType must be either "email" or "phoneNumber"',
        },
        { status: 400 },
      )
    }

    let result
    if (action === 'promote') {
      result = await promoteUserToAdmin(req.payload, userIdentifier, identifierType)
    } else {
      result = await demoteAdminToUser(req.payload, userIdentifier, identifierType)
    }

    return Response.json(result, { status: result.success ? 200 : 400 })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: `Server error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
