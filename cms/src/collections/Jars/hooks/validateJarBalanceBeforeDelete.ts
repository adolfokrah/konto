import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * Hook to validate that jar has no balance before deletion
 * Prevents deletion of jars with existing contributions
 */
export const validateJarBalanceBeforeDelete: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const { payload } = req

  // Skip validation in test environment to allow test cleanup
  if (process.env.NODE_ENV === 'test') {
    return true
  }

  try {
    // Fetch the jar to check its balance
    const jar = await payload.findByID({
      collection: 'jars',
      id,
    })

    if (!jar) {
      throw new Error('Jar not found')
    }

    // Check if jar has any balance
    const totalContributions = jar.totalContributions || 0

    if (totalContributions > 0) {
      throw new Error(
        `Cannot delete jar with existing balance. Current balance: ${totalContributions}. Please withdraw all funds before deleting.`,
      )
    }

    // Allow deletion if balance is 0
    return true
  } catch (error) {
    // Re-throw the error to prevent deletion
    throw error
  }
}
