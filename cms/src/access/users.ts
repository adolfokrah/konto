import type { Access, FieldAccess } from 'payload'

const isAdminUser = (user: unknown): boolean => (user as { role?: string } | null)?.role === 'admin'

/** Collection access: admins only. */
export const adminOnly: Access = ({ req: { user } }) => isAdminUser(user)

/** Field access: admins only (staff, verification, fee and OTP fields). */
export const adminOnlyField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

/** Field access: the user themselves, or an admin (contact details, tokens, settings). */
export const selfOrAdminField: FieldAccess = ({ req: { user }, id, doc }) => {
  if (!user) return false
  if (isAdminUser(user)) return true
  const targetId = (doc as { id?: string } | undefined)?.id ?? id
  return Boolean(targetId) && String(targetId) === String(user.id)
}

/**
 * Like selfOrAdminField, but other logged-in users may still filter on the field (the app's
 * collaborator search queries `email`). Payload checks read access without a document when
 * validating a query, and with the document when returning it, so the value stays hidden.
 */
export const queryableSelfOrAdminField: FieldAccess = (args) => {
  if (!args.doc && !args.id) return Boolean(args.req.user)
  return selfOrAdminField(args)
}
