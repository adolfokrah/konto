import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { slugField } from '@/fields/slug'

export const PaymentMethods: CollectionConfig = {
  slug: 'payment-methods',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'type', 'country', 'isActive'],
    description: 'Payment methods available per country.',
  },
  access: {
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    read: anyone,
  },
  fields: [
    {
      name: 'type',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. mobile-money, bank, card, cash, apple-pay',
      },
    },
    {
      name: 'country',
      type: 'select',
      required: true,
      hasMany: true,
      options: [
        { label: 'Ghana', value: 'ghana' },
        { label: 'Nigeria', value: 'nigeria' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Uncheck to disable this payment method for the country.',
      },
    },
    ...slugField('type'),
  ],
}
