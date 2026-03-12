import { CollectionConfig } from 'payload'

export const DeletedUserAccounts: CollectionConfig = {
  slug: 'deletedUserAccounts',
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phoneNumber',
      type: 'text',
      required: false,
    },
    {
      name: 'deletionReason',
      type: 'text',
      required: false,
    },
  ],
}
