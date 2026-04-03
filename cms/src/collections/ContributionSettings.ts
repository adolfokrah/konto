import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const SettlementDelays: CollectionConfig = {
  slug: 'settlement-delays',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['country', 'hours'],
    description: 'Settlement delay per country.',
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
      name: 'hours',
      type: 'number',
      required: true,
      admin: {
        description: 'Delay before contributions are settled (e.g. 0.033 ≈ 2 min).',
      },
    },
  ],
}
