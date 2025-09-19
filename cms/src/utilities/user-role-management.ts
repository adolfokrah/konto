import type { Payload } from 'payload'

/**
 * Utility to promote a user to admin role
 * This is useful for creating admin users through scripts or API endpoints
 */
export async function promoteUserToAdmin(
  payload: Payload,
  userIdentifier: string, // email or phone number
  identifierType: 'email' | 'phoneNumber' = 'email',
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Find the user
    const whereClause =
      identifierType === 'email'
        ? { email: { equals: userIdentifier } }
        : { phoneNumber: { equals: userIdentifier } }

    const users = await payload.find({
      collection: 'users',
      where: whereClause as any, // Type assertion needed due to Payload's complex where types
      limit: 1,
    })

    if (users.docs.length === 0) {
      return {
        success: false,
        message: `User with ${identifierType} '${userIdentifier}' not found`,
      }
    }

    const user = users.docs[0]

    if (user.role === 'admin') {
      return {
        success: true,
        message: `User '${userIdentifier}' is already an admin`,
        userId: user.id,
      }
    }

    // Update user role to admin
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        role: 'admin',
      },
    })

    return {
      success: true,
      message: `User '${userIdentifier}' has been promoted to admin`,
      userId: user.id,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error promoting user: ${error.message}`,
    }
  }
}

/**
 * Utility to demote an admin user to regular user role
 */
export async function demoteAdminToUser(
  payload: Payload,
  userIdentifier: string, // email or phone number
  identifierType: 'email' | 'phoneNumber' = 'email',
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Find the user
    const whereClause =
      identifierType === 'email'
        ? { email: { equals: userIdentifier } }
        : { phoneNumber: { equals: userIdentifier } }

    const users = await payload.find({
      collection: 'users',
      where: whereClause as any, // Type assertion needed due to Payload's complex where types
      limit: 1,
    })

    if (users.docs.length === 0) {
      return {
        success: false,
        message: `User with ${identifierType} '${userIdentifier}' not found`,
      }
    }

    const user = users.docs[0]

    if (user.role === 'user') {
      return {
        success: true,
        message: `User '${userIdentifier}' is already a regular user`,
        userId: user.id,
      }
    }

    // Update user role to user
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        role: 'user',
      },
    })

    return {
      success: true,
      message: `User '${userIdentifier}' has been demoted to regular user`,
      userId: user.id,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error demoting user: ${error.message}`,
    }
  }
}
