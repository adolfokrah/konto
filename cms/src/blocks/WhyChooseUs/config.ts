import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'

export const WhyChooseUs: Block = {
  slug: 'whyChooseUs',
  interfaceName: 'WhyChooseUsBlock',
  fields: [
    anchorField,
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Main heading for the why choose us section',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Optional subtitle or description',
      },
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      admin: {
        description: 'List of features/benefits to display',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Feature title (e.g., "Trusted by millions")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          admin: {
            description: 'Brief description of the feature',
          },
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Icon or image for this feature',
          },
        },
      ],
    },
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'white',
      options: [
        {
          label: 'White',
          value: 'white',
        },
        {
          label: 'Light Gray',
          value: 'gray',
        },
        {
          label: 'Transparent',
          value: 'transparent',
        },
      ],
      admin: {
        description: 'Background color for the section',
      },
    },
  ],
}
