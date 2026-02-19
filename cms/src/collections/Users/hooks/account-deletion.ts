import { CollectionBeforeDeleteHook } from 'payload'
import { emailService } from '@/utilities/emailService'

export const accountDeletion: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const userId = id

  const user = await req.payload.findByID({
    collection: 'users',
    id: userId,
  })
  // break all jars of this user

  await req.payload.update({
    collection: 'jars',
    where: {
      creator: {
        equals: userId,
      },
    },
    data: {
      status: 'broken',
    },
  })

  // delete all media for the user

  if (user?.photo) {
    await req.payload.delete({
      collection: 'media',
      where: {
        id: {
          equals: user?.photo,
        },
      },
    })
  }

  // send email to users about account deletion
  if (user?.email) {
    await emailService.sendAccountDeletionEmail(
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    )
  }
}
