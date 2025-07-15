import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { APIError, type CollectionConfig } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'

export const Batches: CollectionConfig = {
  slug: 'batches',
  access: {
    read: () => true,
    delete: () => false, // Prevent deletion of batches
  },
  admin: {
    useAsTitle: 'batchNumber',
  },
  defaultSort: 'expiryDate', // FIFO sorting - earliest expiry date first
  fields: [
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
      name: 'batchNumber',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [
          async ({ data, req }) => {
            // Ensure batch is unique across batches
            const existingBatch = await req.payload.find({
              collection: 'batches',
              where: {
                batchNumber: {
                  equals: data?.batchNumber,
                },
                shop: {
                  equals: (data as any)?.shop, // Ensure the batchNumber is unique per shop
                },
                status: {
                  equals: 'active', // Only check active batches
                },
              },
            })

            if (existingBatch?.docs.length) {
              throw new APIError(`Batch ${data?.batchNumber} already exists.`, 400)
            }
          },
        ],
      },
    },
    {
      name: 'expiryDate',
      type: 'date',
      required: true,
      hooks: {
        beforeValidate: [
          async ({ data, operation }) => {
            if (operation === 'create' && new Date(data?.expiryDate) < new Date()) {
              throw new Error('Expiry date cannot be in the past.')
            }
          },
        ],
      },
    },
    {
      name: 'quantity',
      type: 'number',
      defaultValue: 0,
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
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        readOnly: true, // Prevent editing the product after batch creation
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }, // Assuming you want to keep this option
      ],
      defaultValue: 'active',
      admin: {
        description: 'The status of the service.',
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (data?.status === 'inactive') {
          data.product = null // Reset product relationship if batch is inactive
        }
        // Automatically set createdBy to the current user
        return seteCreatedUpdatedBy({
          data,
          operation,
          userId: req.user ? req.user.id : null,
        })
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' || operation === 'update') {
          if (doc?.status == 'inactive' && doc?.product) {
            const product = await req.payload.findByID({
              collection: 'products',
              id: doc.product,
            })
            if (product) {
              // Reset the product reference in the batch
              await req.payload.update({
                collection: 'batches',
                id: doc.id,
                data: {
                  product: null,
                },
              })
            }
          }
        }
      },
    ],
  },
}
