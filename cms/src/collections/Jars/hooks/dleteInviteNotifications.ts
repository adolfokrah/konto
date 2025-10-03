import { CollectionAfterChangeHook } from 'payload'

export const deleteInviteNotifications: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  try {
    // Check if the jar status changed to 'broken'
    if (doc.status === 'broken' && previousDoc?.status !== 'broken') {
      // Delete all unread notifications for this jar
      const deleteResult = await req.payload.delete({
        collection: 'notifications',
        where: {
          and: [
            {
              'data.jarId': {
                equals: doc.id,
              },
            },
            {
              status: {
                equals: 'unread',
              },
            },
          ],
        },
      })

      console.log(
        `Deleted ${deleteResult.docs?.length || 0} unread notifications for broken jar: ${doc.id}`,
      )
    }
  } catch (error) {
    console.error('Error deleting notifications for broken jar:', error)
    // Don't throw error to avoid breaking the jar update operation
  }
}
