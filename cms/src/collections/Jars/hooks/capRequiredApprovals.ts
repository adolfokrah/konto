import type { CollectionBeforeChangeHook } from 'payload'

/**
 * beforeChange hook: ensures requiredApprovals never exceeds the number
 * of accepted admin collectors. Auto-caps and resets to 1 if no admins remain.
 */
export const capRequiredApprovals: CollectionBeforeChangeHook = async ({ data }) => {
  const collectors = Array.isArray(data?.invitedCollectors) ? data.invitedCollectors : []

  const adminCount = collectors.filter(
    (c: any) => c.role === 'admin' && c.status === 'accepted',
  ).length

  const current = data?.requiredApprovals ?? 1

  if (adminCount === 0) {
    data.requiredApprovals = 1
  } else if (current > adminCount) {
    data.requiredApprovals = adminCount
  }

  return data
}
