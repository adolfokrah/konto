/**
 * Cleanup Old Notifications Task
 *
 * Runs daily. Deletes notifications that are:
 * - older than 7 days
 */
export const cleanupOldNotificationsTask = {
  slug: 'cleanup-old-notifications',
  schedule: [
    {
      cron: '0 3 * * *', // Every day at 3:00 AM
      queue: 'cleanup-old-notifications',
    },
  ],
  handler: async (args: any) => {
    try {
      const payload = args.req?.payload || args.payload

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Find notifications older than 7 days
      const old = await payload.find({
        collection: 'notifications',
        where: {
          createdAt: { less_than: oneWeekAgo },
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })

      if (old.docs.length === 0) {
        return { output: { deleted: 0, message: 'No old notifications to delete' } }
      }

      let deletedCount = 0
      for (const n of old.docs) {
        try {
          await payload.delete({
            collection: 'notifications',
            id: (n as any).id,
            overrideAccess: true,
          })
          deletedCount++
        } catch (e: any) {
          console.error(`[cleanup-old-notifications] Error deleting ${(n as any).id}:`, e.message)
        }
      }

      console.log(
        `[cleanup-old-notifications] Deleted ${deletedCount} notifications older than 7 days`,
      )

      return {
        output: {
          deleted: deletedCount,
          message: `Deleted ${deletedCount} notifications older than 7 days`,
        },
      }
    } catch (error: any) {
      console.error('[cleanup-old-notifications] Task error:', error)
      return { output: { deleted: 0, message: `Error: ${error.message}` } }
    }
  },
}
