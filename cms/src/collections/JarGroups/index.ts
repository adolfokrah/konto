import type { CollectionConfig } from 'payload'

export const jarGroup: CollectionConfig = {
  slug: 'jar-groups',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the jar group',
      },
    },
  ],
}
