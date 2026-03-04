import { fcmNotifications } from '@/utilities/fcmPushNotifications'
import type { CollectionAfterChangeHook } from 'payload'

export const sendPushNotification: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  // Only send push notifications when a notification is first created, not on updates
  if (operation !== 'create') return doc
  // Skip FCM when notifications are created by the campaign task (it handles FCM in batches)
  if (req.context?.skipPush) return doc

  try {
    // The relationship field `user` may be either an ID (string) or a populated object
    const rawUser = (doc as any)?.user
    if (!rawUser) return doc

    let userObj: any = null

    if (typeof rawUser === 'string') {
      // Fetch by ID
      try {
        userObj = await req.payload.findByID({
          collection: 'users',
          id: rawUser,
        })
      } catch (e) {
        req.payload.logger.error(
          `sendPushNotification: failed to load user ${rawUser}: ${(e as Error).message}`,
        )
        return doc
      }
    } else if (typeof rawUser === 'object') {
      // Already populated (Depth > 0 scenario) – use directly
      userObj = rawUser
    }

    if (!userObj) return doc

    const fcmToken: string | undefined = userObj.fcmToken
    if (!fcmToken) return doc

    // Derive title based on notification type (fallback generic)

    const res = await fcmNotifications.sendNotification([fcmToken], doc.message, doc.title, {
      type: doc.type,
      ...(doc.data || {}),
    })
  } catch (e) {
    req.payload.logger.error(`sendPushNotification hook error: ${(e as Error).message}`)
  }

  return doc
}
