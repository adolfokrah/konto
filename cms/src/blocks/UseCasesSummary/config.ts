import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'
import { link } from '@/fields/link'

export const UseCasesSummary: Block = {
  slug: 'useCasesSummary',
  interfaceName: 'UseCasesSummaryBlock',
  fields: [
    anchorField,
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Main heading for the use cases section',
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
      name: 'useCases',
      type: 'array',
      minRows: 1,
      maxRows: 10,
      admin: {
        description: 'List of use cases to display',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Use case image or mockup',
          },
        },
        {
          name: 'useCase',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Use case category (e.g., "FUNERALS & MEMORIALS")',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Main title for this use case',
          },
        },
        {
          name: 'description',
          type: 'richText',
          required: true,
          localized: true,
          admin: {
            description: 'Detailed description of the use case',
          },
        },
        {
          name: 'imagePosition',
          type: 'select',
          defaultValue: 'left',
          options: [
            {
              label: 'Left',
              value: 'left',
            },
            {
              label: 'Right',
              value: 'right',
            },
          ],
          admin: {
            description: 'Position of the image relative to the text content',
          },
        },
        {
          name: 'showLink',
          type: 'checkbox',
          admin: {
            description: 'Enable link/button for this use case',
          },
        },
        link({
          overrides: {
            required: false,
            admin: {
              condition: (_, siblingData) => siblingData?.showLink,
              description: 'Call-to-action link for this use case',
            },
          },
        }),
      ],
    },
  ],
}
