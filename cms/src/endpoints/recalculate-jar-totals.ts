import type { PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'

export const recalculateJarTotals = async (req: PayloadRequest) => {
  try {
    await addDataAndFileToRequest(req)

    // Get all jars
    const jars = await req.payload.find({
      collection: 'jars',
      pagination: false,
      overrideAccess: true,
    })

    let updatedCount = 0

    // Process each jar
    for (const jar of jars.docs) {
      // Get count of completed contributions for this jar
      const contributions = await req.payload.find({
        collection: 'contributions',
        where: {
          jar: {
            equals: jar.id,
          },
          paymentStatus: {
            equals: 'completed',
          },
          type: {
            equals: 'contribution',
          },
        },
        pagination: false,
        overrideAccess: true,
      })

      // Just count the contributions
      const totalContributions = contributions.docs.length

      // Update the jar directly in database to avoid validation
      await req.payload.db.updateOne({
        collection: 'jars',
        where: { id: { equals: jar.id } },
        data: {
          totalContributions,
        },
      })

      updatedCount++
      console.log(`Updated jar ${jar.name} (${jar.id}) - Count: ${totalContributions}`)
    }

    return Response.json({
      success: true,
      message: `Successfully updated ${updatedCount} jars`,
      updatedCount,
    })
  } catch (error) {
    console.error('Error recalculating jar totals:', error)
    return Response.json(
      {
        success: false,
        message: 'Error recalculating jar totals',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
