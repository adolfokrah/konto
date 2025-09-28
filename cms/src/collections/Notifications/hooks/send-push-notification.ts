import { fcmNotifications } from '@/utilities/fcmPushNotifications'
import type { CollectionAfterChangeHook } from 'payload'

export const sendPushNotification: CollectionAfterChangeHook = async ({ doc, req }) => {
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
    const title = doc.type === 'jarInvite' ? 'Invitation to contribute' : 'Notification'

    const res = await fcmNotifications.sendNotification([fcmToken], doc.message, title, {
      type: doc.type,
    })
  } catch (e) {
    req.payload.logger.error(`sendPushNotification hook error: ${(e as Error).message}`)
  }

  return doc
}
