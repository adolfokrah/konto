import type { Block } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
  ParagraphFeature,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'

import { anchorField } from '@/fields/anchor'

export const MissionVisionValues: Block = {
  slug: 'missionVisionValues',
  interfaceName: 'MissionVisionValuesBlock',
  fields: [
    anchorField,
    {
      name: 'title',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description:
          'Main heading for the mission, vision & values section (e.g., "Hoga\'s Mission, Vision & Values")',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HeadingFeature({
            enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          ParagraphFeature(),
        ],
      }),
    },
    {
      name: 'subtitle',
      type: 'text',
      required: false,
      localized: true,
      defaultValue: 'Making Community Contributions Simple, Trusted, and Scalable',
      admin: {
        description: 'Subtitle or tagline below the main title',
      },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 3,
      maxRows: 3,
      defaultValue: [
        {
          title: 'Our Vision',
          description:
            'Empowering communities to manage contributions with transparency, trust, and simplicity.',
          icon: 'lightbulb',
        },
        {
          title: 'Our Mission',
          description:
            'To make giving easy and accountable by uniting organizers, collectors, and contributors in one platform.',
          icon: 'bullseye',
        },
        {
          title: 'Our Values',
          description:
            'Built on transparency, trust, and innovation in everything we do strengthens the culture of giving.',
          icon: 'gem',
        },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Title for this item (e.g., "Our Vision", "Our Mission")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
          admin: {
            description: 'Description text for this item',
          },
        },
        {
          name: 'icon',
          type: 'select',
          required: true,
          defaultValue: 'lightbulb',
          options: [
            {
              label: 'Lightbulb (Vision/Ideas)',
              value: 'lightbulb',
            },
            {
              label: 'Crosshair (Mission/Focus)',
              value: 'bullseye',
            },
            {
              label: 'Gem (Values/Premium)',
              value: 'gem',
            },
            {
              label: 'Heart (Care/Love)',
              value: 'heart',
            },
            {
              label: 'Target (Goals/Objectives)',
              value: 'target',
            },
            {
              label: 'Star (Excellence/Achievement)',
              value: 'star',
            },
          ],
          admin: {
            description: 'Icon to display for this item',
          },
        },
      ],
    },
  ],
}
