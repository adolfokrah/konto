import type { CollectionAfterChangeHook } from 'payload'

export const updateJarTotalContributions: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  try {
    if ((operation == 'create' || operation == 'update') && doc.paymentStatus === 'completed') {
      // Get the jar ID
      const jarId = typeof doc.jar === 'string' ? doc.jar : doc.jar?.id
      if (!jarId) {
        console.warn('No jar ID found for contribution:', doc.id)
      }

      // Get current jar data
      const totalContributions = await req.payload.count({
        collection: 'transactions',
        where: {
          jar: {
            equals: jarId,
          },
          paymentStatus: {
            equals: 'completed',
          },
          type: {
            equals: 'contribution',
          },
        },
        overrideAccess: true,
      })

      // Increment the jar's totalContributions
      const newTotal =
        operation == 'create'
          ? 1 + (totalContributions.totalDocs || 0)
          : totalContributions.totalDocs || 0

      console.log('Updating jar total contributions to:', newTotal)

      await req.payload.update({
        collection: 'jars',
        id: jarId,
        data: {
          totalContributions: newTotal,
        },
        overrideAccess: true,
      })
    }
  } catch (error) {
    console.error('Error updating jar total contributions:', error)
  }

  return doc
}
