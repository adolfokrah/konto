import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'
import { link } from '@/fields/link'

export const Metrics: Block = {
  slug: 'metrics',
  interfaceName: 'MetricsBlock',
  fields: [
    anchorField,
    {
      name: 'title',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'Main heading for the metrics section',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      defaultValue: 'Empowering communities to achieve their goals together',
      admin: {
        description: 'Subtitle or tagline below the main title',
      },
    },
    {
      name: 'statistics',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      defaultValue: [
        {
          title: '5M +',
          subtitle: 'Contributions',
          image: null,
        },
        {
          title: '200',
          subtitle: 'Total organizers of',
          image: null,
        },
        {
          title: '300+ jars created',
          subtitle: 'Grow your contributions with no bondaries at all',
          image: null,
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Main statistic number or text (e.g., "5M +", "200")',
          },
        },
        {
          name: 'subtitle',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Description or label for the statistic',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional image/icon for this statistic',
          },
        },
      ],
    },
  ],
}
