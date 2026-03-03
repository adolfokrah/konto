import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

/**
 * Hook to notify the jar creator when their jar is frozen.
 * Triggers when the jar status changes to 'frozen' during an update.
 */
export const sendFreezeNotificationToCreator: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  previousDoc,
}) => {
  try {
    if (operation !== 'update') return doc

    const previousStatus = previousDoc?.status
    const currentStatus = (doc as any)?.status

    // Only trigger when status changes to 'frozen'
    if (currentStatus !== 'frozen' || previousStatus === 'frozen') return doc

    const jarName = (doc as any)?.name || 'a jar'
    const jarId = (doc as any)?.id
    const freezeReason = (doc as any)?.freezeReason || ''

    // Resolve creator ID
    const creatorField = (doc as any)?.creator
    const creatorId =
      typeof creatorField === 'object' && creatorField?.id ? creatorField.id : creatorField

    if (!creatorId) return doc

    // Resolve jar image URL
    let jarImage: string | null = null
    const docImage = (doc as any)?.image
    if (docImage) {
      if (typeof docImage === 'object' && docImage.url) {
        jarImage = docImage.url
      } else if (typeof docImage === 'string') {
        try {
          const media = await req.payload.findByID({ collection: 'media', id: docImage })
          jarImage = (media as any)?.url || null
        } catch {}
      }
    }

    await req.payload.create({
      collection: 'notifications',
      data: {
        title: 'Jar Frozen',
        user: creatorId,
        message: `Your jar "${jarName}" has been frozen.`,
        type: 'jarFrozen',
        status: 'unread',
        data: {
          jarId,
          jarImage,
          freezeReason,
        },
      },
    })
  } catch (e) {
    ;(req as PayloadRequest).payload.logger.error(
      `sendFreezeNotificationToCreator hook error: ${(e as Error).message}`,
    )
  }

  return doc
}
