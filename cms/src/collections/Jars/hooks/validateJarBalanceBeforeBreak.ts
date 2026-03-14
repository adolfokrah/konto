import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'
import { getJarBalance } from '@/utilities/getJarBalance'

/**
 * Prevents a jar from being set to 'broken' if it has a balance > 0.
 */
export const validateJarBalanceBeforeBreak: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation !== 'update') return data

  // Only check when status is changing to 'broken'
  if (data?.status !== 'broken' || originalDoc?.status === 'broken') return data

  const jarId = originalDoc?.id
  if (!jarId) return data

  const { balance } = await getJarBalance(req.payload, jarId)

  if (balance > 0) {
    throw new APIError(
      `Cannot break a jar with remaining balance of ${balance.toFixed(2)}. Please withdraw all funds first.`,
      400,
    )
  }

  return data
}
