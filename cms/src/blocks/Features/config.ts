import type { Block } from 'payload'

import { link } from '@/fields/link'

export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Main heading for the features section',
      },
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      admin: {
        description: 'List of features to display',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Feature title',
          },
        },
        {
          name: 'subtitle',
          type: 'text',
          localized: true,
          admin: {
            description: 'Feature subtitle or description',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Feature image',
          },
        },
        {
          name: 'showLink',
          type: 'checkbox',
          admin: {
            description: 'Enable link/button for this feature',
          },
        },
        link({
          overrides: {
            required: false,
            admin: {
              condition: (_, siblingData) => siblingData?.showLink,
              description: 'Button link for this feature',
            },
          },
        }),
      ],
    },
  ],
}
