import { CollectionBeforeDeleteHook } from 'payload'
import { resend } from '@/utilities/initalise'

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
  await resend.emails.send({
    from: 'Hoga <noreply@usehoga.com>',
    to: user?.email || '',
    subject: 'Account Deletion',
    html: '<p>Your account has been deleted.</p>',
  })
}
