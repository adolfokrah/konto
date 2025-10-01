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

    const newCollectors = currentCollectors.filter((c) => {
      const collectorId = getCollectorId(c.collector)
      if (!collectorId) return false
      const isNew = !prevCollectorIds.has(collectorId)
      return isNew
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

    // Query users by ID using 'in' operator
    const usersRes = await req.payload.find({
      collection: 'users',
      where: {
        id: { in: collectorIds },
      },
      limit: collectorIds.length,
    })

    if (!usersRes?.docs?.length) return doc

    const inviterName = (req.user as any)?.fullName || 'Someone'
    const jarName = (doc as any)?.name || 'a jar'
    const jarId = (doc as any)?.id

    // Prepare notification create promises
    const createPromises = usersRes.docs.map((user: any) =>
      req.payload.create({
        collection: 'notifications',
        data: {
          title: 'Jar Invitation',
          user: user.id,
          // Consistent message referencing inviter & jar
          message: `${inviterName} invited you to contribute to: ${jarName}`,
          type: 'jarInvite',
          status: 'unread',
          data: {
            jarId,
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
