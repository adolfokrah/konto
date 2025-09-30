import { fcmNotifications } from '@/utilities/fcmPushNotifications'
import type { CollectionAfterChangeHook, PayloadRequest } from 'payload'

// Shape of an invited collector entry (array row) in the jar document
interface InvitedCollectorRow {
  id?: string // Payload array row id
  collector?: string | { id?: string } | null
  phoneNumber?: string | null
  status?: string
  name?: string | null
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

    // Determine new collectors (by phoneNumber; fallback to row id if phone missing)
    const prevKeySet = new Set(
      prevCollectors.map((c) => (c.phoneNumber ? c.phoneNumber : c.id)).filter(Boolean) as string[],
    )

    const newCollectors = currentCollectors.filter((c) => {
      const key = c.phoneNumber ? c.phoneNumber : c.id
      if (!key) return false
      return !prevKeySet.has(key)
    })

    if (newCollectors.length === 0) return doc

    // Collect phone numbers for users lookup; filter out null/undefined and duplicates
    const phoneNumbers = Array.from(
      new Set(
        newCollectors
          .map((c) => c.phoneNumber)
          .filter((p): p is string => typeof p === 'string' && p.trim().length > 0),
      ),
    )

    if (phoneNumbers.length === 0) return doc // nothing resolvable

    // Query users by phoneNumber using 'in' operator (Payload supports logical conditions)
    const usersRes = await req.payload.find({
      collection: 'users',
      where: {
        phoneNumber: { in: phoneNumbers },
      },
      limit: phoneNumbers.length,
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
