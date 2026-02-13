import { CollectionBeforeChangeHook, APIError } from 'payload'

/**
 * Hook to validate that user has completed KYC before setting withdrawal account
 * This ensures users can only set withdrawal account details after KYC verification
 */
export const validateKycForWithdrawalAccount: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // Only validate for update operations
  if (operation !== 'update') {
    return data
  }

  // Check if user is trying to set or update withdrawal account details
  const isSettingWithdrawalAccount =
    (data?.accountNumber && data.accountNumber !== originalDoc?.accountNumber) ||
    (data?.bank && data.bank !== originalDoc?.bank) ||
    (data?.accountHolder && data.accountHolder !== originalDoc?.accountHolder)

  // If not setting withdrawal account, allow the update
  if (!isSettingWithdrawalAccount) {
    return data
  }

  // Get the user being updated
  const userId = req.data?.id || originalDoc?.id

  if (!userId) {
    return data
  }

  // Fetch the user to check KYC status
  const user = await req.payload.findByID({
    collection: 'users',
    id: userId,
  })

  // Check if user has completed KYC verification
  if (user?.kycStatus !== 'verified') {
    throw new APIError(
      'You must complete KYC verification before setting a withdrawal account',
      403,
    )
  }

  return data
}
