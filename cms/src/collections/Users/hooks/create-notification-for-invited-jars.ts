import type { CollectionAfterChangeHook } from 'payload'

// After a user is created, find any jars that list this phone number in invitedCollectors
// and create an invitation notification for the user (if one doesn't already exist).
export const sendInviteNotificationToUser: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  try {
    const phoneNumber: string | undefined = (doc as any)?.phoneNumber
    if (!phoneNumber || phoneNumber.trim().length === 0) return doc

    // 1. Find jars where any invitedCollectors.phoneNumber equals this number
    const jarsRes = await req.payload.find({
      collection: 'jars',
      where: {
        'invitedCollectors.phoneNumber': { equals: phoneNumber },
      },
      limit: 200, // safety cap
    })

    if (!jarsRes?.docs?.length) return doc // no jars referencing this number

    // 2. For each such jar, create a notification if none exists yet for this jar+user
    for (const jar of jarsRes.docs) {
      const jarId = jar.id
      if (!jarId) continue

      // Check existing notifications to avoid duplicates
      const existing = await req.payload.find({
        collection: 'notifications',
        where: {
          user: { equals: doc.id },
          'data.jarId': { equals: jarId },
          type: { equals: 'jarInvite' },
        },
        limit: 1,
      })
      if (existing.totalDocs && existing.totalDocs > 0) {
        continue // already notified
      }

      await req.payload.create({
        collection: 'notifications',
        data: {
          user: doc.id,
          message: `${typeof jar?.creator === 'object' ? jar?.creator?.fullName : 'Someone'} invited you as a collector to: ${jar.name || 'a jar'}`,
          type: 'jarInvite',
          status: 'unread',
          data: {
            jarId,
          },
        },
      })
    }
  } catch (e) {
    req.payload.logger.error(
      `sendInviteNotificationToUser (user create) error: ${(e as Error).message}`,
    )
  }

  return doc
}
