import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

// Shape of an invited collector entry (array row) in the jar document
interface InvitedCollectorRow {
  id?: string // Payload array row id
  collector: string | { id?: string } // User ID (can be string or populated object)
  status?: string
}

// Utility to coerce an unknown value into an array of InvitedCollectorRow
function asInvitedCollectors(value: unknown): InvitedCollectorRow[] {
  if (!Array.isArray(value)) return []
  return value as InvitedCollectorRow[]
}

// Helper function to extract collector ID from either string or object
const getCollectorId = (collector: any): string | null => {
  if (typeof collector === 'string') return collector
  if (collector && typeof collector === 'object' && collector.id) return collector.id
  return null
}

export const deleteInviteNotification: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  previousDoc,
}) => {
  try {
    if (operation !== 'update') return doc

    const currentCollectors = asInvitedCollectors((doc as any).invitedCollectors)
    const prevCollectors = asInvitedCollectors((previousDoc as any)?.invitedCollectors)

    // Get current collector IDs
    const currentCollectorIds = new Set(
      currentCollectors.map((c) => getCollectorId(c.collector)).filter(Boolean) as string[],
    )

    // Find removed collectors (existed in previous but not in current)
    const removedCollectorIds = prevCollectors
      .map((c) => getCollectorId(c.collector))
      .filter((id): id is string => {
        return id !== null && !currentCollectorIds.has(id)
      })

    if (removedCollectorIds.length === 0) return doc

    console.log('Removed collector IDs:', removedCollectorIds)

    const jarId = (doc as any)?.id

    // Delete jar invitation notifications for removed collectors
    const deletePromises = removedCollectorIds.map(async (userId) => {
      try {
        // Find and delete notifications for this user and jar
        const notificationsRes = await req.payload.find({
          collection: 'notifications',
          where: {
            and: [
              { user: { equals: userId } },
              { type: { equals: 'jarInvite' } },
              { 'data.jarId': { equals: jarId } },
            ],
          },
        })

        if (notificationsRes?.docs?.length) {
          const deleteNotificationPromises = notificationsRes.docs.map((notification: any) =>
            req.payload.delete({
              collection: 'notifications',
              id: notification.id,
            }),
          )

          await Promise.allSettled(deleteNotificationPromises)
          console.log(
            `Deleted ${notificationsRes.docs.length} jar invitation notifications for user ${userId}`,
          )
        }
      } catch (error) {
        console.error(`Error deleting notifications for user ${userId}:`, error)
      }
    })

    await Promise.allSettled(deletePromises)
  } catch (e) {
    ;(req as PayloadRequest).payload.logger.error(
      `deleteInviteNotification hook error: ${(e as Error).message}`,
    )
  }

  return doc
}
