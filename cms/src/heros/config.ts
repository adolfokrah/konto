import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
      ],
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'subTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'buttonTitle',
      type: 'text',
      label: 'Button Title',
      defaultValue: 'Download App',
      localized: true,
      admin: {
        condition: (_, { type } = {}) => ['highImpact'].includes(type),
      },
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
    {
      name: 'avatarsSection',
      type: 'group',
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show Avatars Section',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Section Title',
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Section Subtitle',
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'avatars',
          type: 'array',
          label: 'User Avatars',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          maxRows: 6,
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'name',
              type: 'text',
              label: 'User Name (for alt text)',
              required: true,
            },
          ],
        },
        {
          name: 'appStoreLinks',
          type: 'group',
          label: 'App Store Links',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'App Store Section Title',
              localized: true,
              admin: {
                placeholder: 'Available on',
              },
            },
            {
              name: 'appleAppStoreUrl',
              type: 'text',
              label: 'Apple App Store URL',
              admin: {
                placeholder: 'https://apps.apple.com/app/...',
              },
            },
            {
              name: 'googlePlayStoreUrl',
              type: 'text',
              label: 'Google Play Store URL',
              admin: {
                placeholder: 'https://play.google.com/store/apps/details?id=...',
              },
            },
          ],
        },
      ],
    },
  ],
  label: false,
}
