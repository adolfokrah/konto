import type { CollectionConfig } from 'payload'

import { generatePaymentLink } from './hooks'

export const Jars: CollectionConfig = {
  slug: 'jars',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the jar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Description of the jar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload an image for the jar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether the jar is currently active',
      },
    },
    {
      name: 'isFixedContribution',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the contribution amount is fixed',
      },
    },
    {
      name: 'acceptedContributionAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Accepted contribution amount for fixed contributions',
        condition: data => data.isFixedContribution,
      },
    },
    {
      name: 'goalAmount',
      type: 'number',
      required: false,
      admin: {
        description: 'Target amount for the jar',
      },
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'Ghanaian Cedi', value: 'ghc' },
        { label: 'Nigerian Naira', value: 'ngn' },
      ],
      required: true,
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      filterOptions: ({ req: _req }) => {
        // This filter can be customized based on the request context
        return {
          isKYCVerified: { equals: true },
        }
      },
      admin: {
        description: 'User who created the jar',
      },
    },
    {
      name: 'collectors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: ({ data }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {}

        if (data?.creator) {
          filters.id = {
            not_equals: data.creator,
          }
        }

        return filters
      },
      admin: {
        description: 'Users who can contribute to this jar (excluding the creator)',
      },
    },
    {
      name: 'paymentLink',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'acceptAnonymousContributions',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow anonymous contributions to this jar',
      },
    },
    {
      name: 'acceptedPaymentMethods',
      type: 'select',
      options: [
        { label: 'Mobile Money', value: 'mobile-money' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Cash', value: 'cash' },
      ],
      hasMany: true,
      required: true,
      admin: {
        description: 'Payment methods accepted for contributions to this jar',
      },
    },
  ],
  hooks: {
    beforeChange: [],
    afterChange: [generatePaymentLink],
  },
}
