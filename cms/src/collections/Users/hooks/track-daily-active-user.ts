import type { CollectionAfterReadHook } from 'payload'

export const trackDailyActiveUser: CollectionAfterReadHook = async ({ doc, req }) => {
  // Only track daily active users if this is from a login context
  // We can identify this by checking if the request has authentication
  if (req.user && req.user.id === doc.id) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Start of today
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1) // Start of tomorrow

      // Check if user already has a record for today
      const existingDailyRecord = await req.payload.find({
        collection: 'dailyActiveUsers',
        where: {
          user: {
            equals: doc.id,
          },
          createdAt: {
            greater_than_equal: today.toISOString(),
            less_than: tomorrow.toISOString(),
          },
        },
        limit: 1,
        overrideAccess: true,
      })

      // Only create record if none exists for today
      if (existingDailyRecord.docs.length === 0) {
        await req.payload.create({
          collection: 'dailyActiveUsers',
          data: {
            user: doc.id,
          },
          overrideAccess: true,
        })
      }
    } catch (error) {
      // Log error but don't fail the request
      console.error('Error tracking daily active user:', error)
    }
  }

  return doc
}
