import { fcmNotifications } from '@/utilities/fcmPushNotifications'
import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

// Shape of an invited collector entry (array row) in the jar document
interface InvitedCollectorRow {
  id?: string // Payload array row id
  collector: string // User ID (required)
  status?: string
}

// Utility to coerce an unknown value into an array of InvitedCollectorRow
function asInvitedCollectors(value: unknown): InvitedCollectorRow[] {
  if (!Array.isArray(value)) return []
  return value as InvitedCollectorRow[]
}

export const sendInviteNotificationToUser: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  previousDoc,
}) => {
  try {
    if (operation !== 'create' && operation !== 'update') return doc

    const currentCollectors = asInvitedCollectors((doc as any).invitedCollectors)
    const prevCollectors = asInvitedCollectors((previousDoc as any)?.invitedCollectors)

    // Helper function to extract collector ID from either string or object
    const getCollectorId = (collector: any): string | null => {
      if (typeof collector === 'string') return collector
      if (collector && typeof collector === 'object' && collector.id) return collector.id
      return null
    }

    // Determine new collectors by collector ID
    const prevCollectorIds = new Set(
      prevCollectors.map((c) => getCollectorId(c.collector)).filter(Boolean) as string[],
    )

    // Only consider pending collectors that weren't in the previous version
    const newCollectors = currentCollectors.filter((c) => {
      const collectorId = getCollectorId(c.collector)
      if (!collectorId) return false
      // Skip collectors that already existed or are already accepted
      if (prevCollectorIds.has(collectorId)) return false
      if (c.status === 'accepted') return false
      return true
    })

    if (newCollectors.length === 0) return doc

    // Collect collector IDs for users lookup; filter out duplicates
    const collectorIds = Array.from(
      new Set(
        newCollectors
          .map((c) => getCollectorId(c.collector))
          .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
      ),
    )

    if (collectorIds.length === 0) return doc // nothing resolvable

    const jarId = (doc as any)?.id

    // Check for existing jar invite notifications to prevent duplicates
    const existingNotifications = await req.payload.find({
      collection: 'notifications',
      where: {
        type: { equals: 'jarInvite' },
        'data.jarId': { equals: jarId },
        user: { in: collectorIds },
      },
      pagination: false,
      select: { user: true },
    })

    const alreadyNotifiedUserIds = new Set(
      existingNotifications.docs.map((n: any) =>
        typeof n.user === 'string' ? n.user : n.user?.id,
      ),
    )

    // Only notify users who don't already have an invite notification for this jar
    const usersToNotify = collectorIds.filter((id) => !alreadyNotifiedUserIds.has(id))

    if (usersToNotify.length === 0) return doc

    // Query users by ID using 'in' operator
    const usersRes = await req.payload.find({
      collection: 'users',
      where: {
        id: { in: usersToNotify },
      },
      limit: usersToNotify.length,
    })

    if (!usersRes?.docs?.length) return doc

    const inviterName = (req.user as any)?.fullName || 'Someone'
    const jarName = (doc as any)?.name || 'a jar'
    const jarDescription = (doc as any)?.description || ''

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

    // Resolve creator photo URL (Users collection field is 'photo', not 'avatar')
    let creatorAvatar: string | null = null
    const userPhoto = (req.user as any)?.photo
    if (userPhoto) {
      if (typeof userPhoto === 'object' && userPhoto.url) {
        creatorAvatar = userPhoto.url
      } else if (typeof userPhoto === 'string') {
        try {
          const media = await req.payload.findByID({ collection: 'media', id: userPhoto })
          creatorAvatar = (media as any)?.url || null
        } catch {}
      }
    }

    // Prepare notification create promises
    const createPromises = usersRes.docs.map((user: any) =>
      req.payload.create({
        collection: 'notifications',
        data: {
          title: 'Jar Invitation',
          user: user.id,
          message: `${inviterName} invited you as a collector for ${jarName}`,
          type: 'jarInvite',
          status: 'unread',
          data: {
            jarId,
            jarImage,
            jarDescription,
            creatorName: inviterName,
            creatorAvatar,
          },
        },
      }),
    )

    await Promise.allSettled(createPromises)
  } catch (e) {
    ;(req as PayloadRequest).payload.logger.error(
      `sendInviteNotificationToUser hook error: ${(e as Error).message}`,
    )
  }

  return doc // Always return the (possibly modified) doc per Payload hook contract
}
