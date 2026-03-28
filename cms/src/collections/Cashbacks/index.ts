import type { CollectionConfig } from 'payload'

export const Cashbacks: CollectionConfig = {
  slug: 'cashbacks',
  labels: {
    singular: 'Cashback',
    plural: 'Cashbacks',
  },
  admin: {
    useAsTitle: 'contributor',
    defaultColumns: [
      'contributor',
      'jarName',
      'originalAmount',
      'discountPercent',
      'discountAmount',
      'createdAt',
    ],
  },
  access: {
    create: () => false, // created programmatically only
    read: ({ req: { user } }) => {
      if ((user as any)?.role === 'admin') return true
      if (user) return { user: { equals: user.id } }
      return false
    },
    update: ({ req: { user } }) => (user as any)?.role === 'admin',
    delete: ({ req: { user } }) => (user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      required: true,
      hasMany: false,
      index: true,
      admin: {
        description: 'The transaction this cashback is linked to',
        readOnly: true,
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      admin: {
        description: 'The user who received this discount',
        readOnly: true,
      },
    },
    {
      name: 'contributor',
      type: 'text',
      required: false,
      admin: {
        description: 'Contributor name (denormalised for display)',
        readOnly: true,
      },
    },
    {
      name: 'jarName',
      type: 'text',
      required: false,
      admin: {
        description: 'Jar name at time of contribution (denormalised)',
        readOnly: true,
      },
    },
    {
      name: 'originalAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'Amount contributed (GHS)',
        readOnly: true,
      },
    },
    {
      name: 'discountPercent',
      type: 'number',
      required: true,
      admin: {
        description: 'Discount percentage applied (0–100)',
        readOnly: true,
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      required: true,
      admin: {
        description: 'GHS amount Hogapay absorbed as discount',
        readOnly: true,
      },
    },
    {
      name: 'hogapayRevenue',
      type: 'number',
      required: true,
      admin: {
        description: 'Hogapay revenue after discount (GHS)',
        readOnly: true,
      },
    },
  ],
}
