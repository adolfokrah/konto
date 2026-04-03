import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const RefundFees: CollectionConfig = {
  slug: 'refund-fees',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['country', 'fee'],
    description: 'Refund fee rates per country.',
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
      name: 'fee',
      type: 'number',
      required: true,
      admin: {
        description: 'Percentage fee deducted from refund amount (e.g. 1%).',
      },
    },
  ],
}
