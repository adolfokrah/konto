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

    // FCM data payload only accepts string values — coerce everything
    const rawData: Record<string, any> = { type: doc.type, ...(doc.data || {}) }
    const fcmData: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawData)) {
      fcmData[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }

    const res = await fcmNotifications.sendNotification([fcmToken], doc.message, doc.title, fcmData)
  } catch (e) {
    req.payload.logger.error(`sendPushNotification hook error: ${(e as Error).message}`)
  }

  return doc
}
