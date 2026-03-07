/**
 * afterChange hook on Refunds collection.
 *
 * Creates an in-app notification for the jar creator
 * when a refund is initiated (created) or completed.
 */
export const notifyJarCreator = async ({
  doc,
  previousDoc,
  operation,
  req,
}: {
  doc: any
  previousDoc?: any
  operation: 'create' | 'update'
  req: any
}) => {
  const isNew = operation === 'create'
  const isNewlyCompleted =
    operation === 'update' && doc.status === 'completed' && previousDoc?.status !== 'completed'

  if (!isNew && !isNewlyCompleted) return

  const jarId = typeof doc.jar === 'object' ? doc.jar?.id : doc.jar
  if (!jarId) return

  try {
    const jar = await req.payload.findByID({
      collection: 'jars',
      id: jarId,
      depth: 0,
      overrideAccess: true,
    })

    const creatorId = typeof jar.creator === 'object' ? jar.creator?.id : jar.creator
    if (!creatorId) return

    const amount = Math.abs(doc.amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const contributor = doc.accountName || 'Unknown'

    const title = isNew ? 'Refund Requested' : 'Refund Completed'
    const message = isNew
      ? `A refund of GHS ${amount} has been requested for ${contributor} in ${jar.name || 'your jar'}.`
      : `A refund of GHS ${amount} to ${contributor} in ${jar.name || 'your jar'} has been completed.`

    await req.payload.create({
      collection: 'notifications',
      data: {
        type: 'info',
        title,
        message,
        user: creatorId,
        data: {
          refundId: doc.id,
          jarId,
          amount: doc.amount,
          status: doc.status,
        },
      },
      overrideAccess: true,
    })
  } catch (err: any) {
    console.error(`[notify-jar-creator] Failed to create notification:`, err.message)
  }
}
