import type { Block, Field } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { anchorField } from '@/fields/anchor'
import { link } from '@/fields/link'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      {
        label: 'One Third',
        value: 'oneThird',
      },
      {
        label: 'Half',
        value: 'half',
      },
      {
        label: 'Two Thirds',
        value: 'twoThirds',
      },
      {
        label: 'Full',
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          BlocksFeature({
            blocks: [
              {
                slug: 'mediaBlock',
                fields: [
                  {
                    name: 'media',
                    type: 'upload',
                    relationTo: 'media',
                    required: true,
                  },
                  {
                    name: 'caption',
                    type: 'text',
                    label: 'Caption',
                  },
                ],
              },
              {
                slug: 'banner',
                fields: [
                  {
                    name: 'style',
                    type: 'select',
                    defaultValue: 'info',
                    options: [
                      { label: 'Info', value: 'info' },
                      { label: 'Warning', value: 'warning' },
                      { label: 'Error', value: 'error' },
                      { label: 'Success', value: 'success' },
                    ],
                    required: true,
                  },
                  {
                    name: 'content',
                    type: 'richText',
                    editor: lexicalEditor({
                      features: ({ rootFeatures }) => [
                        ...rootFeatures,
                        FixedToolbarFeature(),
                        InlineToolbarFeature(),
                      ],
                    }),
                  },
                ],
              },
              {
                slug: 'alert',
                fields: [
                  {
                    name: 'style',
                    type: 'select',
                    defaultValue: 'warning',
                    options: [
                      { label: 'Info', value: 'info' },
                      { label: 'Warning', value: 'warning' },
                      { label: 'Error', value: 'error' },
                      { label: 'Success', value: 'success' },
                    ],
                    required: true,
                  },
                  {
                    name: 'title',
                    type: 'text',
                    label: 'Alert Title',
                    required: true,
                  },
                ],
              },
            ],
          }),
        ]
      },
    }),
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'anchor',
      type: 'text',
      admin: {
        description:
          'Optional anchor ID for linking to this block (e.g., "about-us", "services"). Will be used as the HTML id attribute.',
        placeholder: 'e.g., about-us, services, contact',
      },
      validate: (value: string | null | undefined) => {
        if (value && typeof value === 'string') {
          // Check if it's a valid HTML id (alphanumeric, hyphens, underscores, no spaces)
          if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
            return 'Anchor must start with a letter and contain only letters, numbers, hyphens, and underscores'
          }
        }
        return true
      },
    },
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
  ],
}
