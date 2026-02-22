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

    // Check if jar is frozen (AML compliance)
    if (jar.status === 'frozen') {
      throw new Error('Cannot delete a frozen jar. Please unfreeze it first.')
    }

    // Check if jar has any completed contributions
    const contributions = await payload.find({
      collection: 'transactions',
      where: {
        jar: { equals: id },
        paymentStatus: { equals: 'completed' },
        type: { equals: 'contribution' },
      },
      pagination: false,
      select: { amountContributed: true },
      overrideAccess: true,
    })

    const totalContributions = contributions.docs.reduce(
      (sum, tx: any) => sum + (tx.amountContributed || 0),
      0,
    )

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
