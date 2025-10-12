import { CollectionConfig } from 'payload'

export const DailyActiveUsers: CollectionConfig = {
  slug: 'dailyActiveUsers',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
}
