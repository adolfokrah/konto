import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { type CollectionConfig } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'

export const Batches: CollectionConfig = {
  slug: 'batches',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'batchNumber',
  },
  fields: [
    {
      name: 'batchNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'expiryDate',
      type: 'date',
      required: true,
      validate: (data: any) => {
        const today = new Date()
        const expiry = new Date(data)
        if (expiry < today) {
          return 'Expiry date cannot be in the past.'
        }
        return true
      },
    },
    {
      name: 'quantity',
      type: 'number',
      admin: {
        readOnly: true, // Prevent manual editing of quantity
        description:
          'This field is automatically updated based on the product inventory from stock updates.',
        components: {
          Cell: './components/QuantityCell', // Assuming you have a QuantityCell component for displaying quantities
        },
      },
    },
    {
      name: 'stockAlert',
      type: 'number',
      required: true,
      validate: (data: any) => {
        if (data <= 0) {
          return 'Stock alert must be greater than zero.'
        }
        return true
      },
    },
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
      admin: {
        description: 'Select the shop associated with this stock entry.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        readOnly: true, // Prevent editing the product after batch creation
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Automatically set createdBy to the current user
        return seteCreatedUpdatedBy({
          data,
          operation,
          userId: req.user ? req.user.id : null,
        })
      },
    ],
  },
}
