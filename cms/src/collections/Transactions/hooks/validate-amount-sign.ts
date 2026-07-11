import { CollectionBeforeValidateHook, APIError } from 'payload'

export const validateAmountSign: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  // Only check when amountContributed is being changed
  if (data?.amountContributed == null) return

  // Resolve the effective transaction type:
  // 1. From data (if being set/changed)
  // 2. Else from existing doc (on update)
  const type = data.type ?? (originalDoc as any)?.type

  // Payouts may be negative (outflow). Contributions must be positive.
  if (type !== 'payout' && data.amountContributed < 0) {
    throw new APIError('Amount Contributed must be a positive number', 400)
  }

  // Suppress unused warning
  void operation
}
