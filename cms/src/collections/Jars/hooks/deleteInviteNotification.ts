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

    const jarId = (doc as any)?.id
    const jarName = (doc as any)?.name || 'a jar'

    // Find collectors whose role changed from admin to non-admin
    const demotedCollectorIds = currentCollectors
      .map((c) => {
        const id = getCollectorId(c.collector)
        if (!id) return null
        const prev = prevCollectors.find((p) => getCollectorId(p.collector) === id)
        if (prev && (prev as any).role === 'admin' && (c as any).role !== 'admin') return id
        return null
      })
      .filter((id): id is string => id !== null)

    // Delete unread payout-approval notifications for demoted collectors
    if (demotedCollectorIds.length > 0) {
      const demotePromises = demotedCollectorIds.map(async (userId) => {
        try {
          await deleteUnreadPayoutNotifications(req, userId, jarId)
        } catch (error) {
          console.error(`Error deleting payout notifications for demoted user ${userId}:`, error)
        }
      })
      await Promise.allSettled(demotePromises)
    }

    if (removedCollectorIds.length === 0) return doc

    // Delete jar invitation notifications and payout-approval notifications for removed collectors
    const deletePromises = removedCollectorIds.map(async (userId) => {
      try {
        // Find and delete jar invite notifications for this user and jar
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
        }

        // Delete unread payout-approval notifications
        await deleteUnreadPayoutNotifications(req, userId, jarId)

        // Check if this was an accepted collector (not just a pending invite being cancelled)
        const wasAccepted = prevCollectors.some((c) => {
          const cId = getCollectorId(c.collector)
          return cId === userId && c.status === 'accepted'
        })

        if (wasAccepted) {
          await req.payload.create({
            collection: 'notifications',
            data: {
              type: 'info',
              status: 'unread',
              title: 'Removed from Jar',
              message: `You have been removed from "${jarName}".`,
              user: userId,
              data: {
                jarId,
                type: 'collector-removed',
              },
            },
            overrideAccess: true,
          })
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

// Delete unread payout-approval notifications for a user on a specific jar
async function deleteUnreadPayoutNotifications(req: PayloadRequest, userId: string, jarId: string) {
  const payoutNotifications = await req.payload.find({
    collection: 'notifications',
    where: {
      and: [
        { user: { equals: userId } },
        { type: { equals: 'payout-approval' } },
        { status: { equals: 'unread' } },
        { 'data.jarId': { equals: jarId } },
      ],
    },
    overrideAccess: true,
  })

  if (payoutNotifications?.docs?.length) {
    const deletePromises = payoutNotifications.docs.map((n: any) =>
      req.payload.delete({
        collection: 'notifications',
        id: n.id,
        overrideAccess: true,
      }),
    )
    await Promise.allSettled(deletePromises)
  }
}
