import type { Block } from 'payload'

import { anchorField } from '@/fields/anchor'

export const Pricing: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  fields: [
    anchorField,
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Simple Pricing Designed to Keep Contributions Transparent',
      admin: {
        description: 'Main heading for the pricing section',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      defaultValue: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'Contributors cover a 1.95% telcos transaction fee while organizers pay a max of 2% platform fee. Organizers can also choose to pass this fee to contributors for maximum flexibility.',
                },
              ],
            },
          ],
        },
      },
      admin: {
        description: 'Description text explaining the pricing model',
      },
    },
    {
      name: 'calculatorSection',
      type: 'group',
      fields: [
        {
          name: 'requestLabel',
          type: 'text',
          defaultValue: 'You request',
          localized: true,
          admin: {
            description: 'Label for the amount input section',
          },
        },
        {
          name: 'chargesBreakdownLabel',
          type: 'text',
          defaultValue: 'Charges break down',
          localized: true,
        },
        {
          name: 'contributorPaysLabel',
          type: 'text',
          defaultValue: 'Contributor pays',
          localized: true,
        },
        {
          name: 'transferFeeLabel',
          type: 'text',
          defaultValue: 'Transfer fee',
          localized: true,
        },
        {
          name: 'youReceiveLabel',
          type: 'text',
          defaultValue: 'You receive',
          localized: true,
        },
      ],
    },
    {
      name: 'feeStructure',
      type: 'group',
      admin: {
        description: 'Fee percentages matching the CMS System Settings',
      },
      fields: [
        {
          name: 'collectionFee',
          type: 'number',
          defaultValue: 1.95,
          admin: {
            description: 'Collection fee percentage (matches System Settings collectionFee)',
            step: 0.01,
          },
        },
        {
          name: 'transferFeePercentage',
          type: 'number',
          defaultValue: 1,
          admin: {
            description: 'Transfer fee percentage (matches System Settings transferFeePercentage)',
            step: 0.1,
          },
        },
      ],
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      defaultValue: [
        { feature: 'Free, automatic settlement within 24 hours' },
        { feature: 'No sign up fees' },
        { feature: 'No hidden fees or charges' },
        { feature: 'No currency conversion fees' },
      ],
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Feature or benefit description',
          },
        },
      ],
    },
    {
      name: 'ctaButton',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Do the math',
          localized: true,
          admin: {
            description: 'Button text that will focus on the calculator when clicked',
          },
        },
      ],
    },
    {
      name: 'poweredBy',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Powered by',
          localized: true,
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Payment provider logo (e.g., Paystack)',
          },
        },
      ],
    },
  ],
}
