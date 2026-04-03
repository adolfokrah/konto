import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const CollectionFees: CollectionConfig = {
  slug: 'collection-fees',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['country', 'paymentMethod', 'fee', 'hogapaySplit'],
    description: 'Collection fee rates per country and payment method.',
  },
  access: {
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    read: anyone,
  },
  fields: [
    {
      name: 'country',
      type: 'select',
      required: true,
      options: [
        { label: 'Ghana', value: 'ghana' },
        { label: 'Nigeria', value: 'nigeria' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'relationship',
      relationTo: 'payment-methods',
      required: true,
      admin: {
        description: 'The payment method this fee applies to.',
      },
    },
    {
      name: 'fee',
      type: 'number',
      required: true,
      admin: {
        description: 'Total fee percentage charged to the contributor (%).',
      },
    },
    {
      name: 'hogapaySplit',
      type: 'number',
      required: true,
      admin: {
        description: "Hogapay's share of the fee (%).",
      },
    },
    {
      name: 'minimumContributionAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Minimum contribution amount allowed for this payment method.',
      },
    },
  ],
}
