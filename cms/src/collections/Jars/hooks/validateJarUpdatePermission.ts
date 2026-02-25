import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to validate that only the jar creator or an admin can update jar details.
 * Prevents invited collectors from modifying jar settings.
 */
export const validateJarUpdatePermission: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Only apply to updates, not creates
  if (operation !== 'update') return data

  // Skip for internal/admin panel operations (overrideAccess)
  if (!req.user) return data

  const user = req.user as any
  const isAdmin = user.role === 'admin'

  if (isAdmin) return data

  // Get the jar creator ID
  const creatorId =
    typeof originalDoc?.creator === 'object' ? originalDoc.creator.id : originalDoc?.creator

  if (!creatorId) return data

  if (user.id !== creatorId) {
    throw new Error('Only the jar creator or an admin can update this jar.')
  }

  return data
}
