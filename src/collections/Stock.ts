// collections/Products.ts
import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { type CollectionConfig, APIError } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'

const Stock: CollectionConfig = {
  slug: 'stock',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true,
    update: () => false, // Allow updates to stock
    delete: () => false, // Prevent deletion of stock entries
  },
  fields: [
    {
      name: 'supplier',
      type: 'relationship',
      relationTo: 'suppliers',
      required: false,
      admin: {
        description: 'Select the supplier for this stock entry.',
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'Transfer', value: 'transfer' },
        { label: 'Sale', value: 'sale' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Adjustment', value: 'adjustment' },
        { label: 'Return', value: 'return' },
      ],
      required: true,
      defaultValue: 'purchase',
      admin: {
        description: 'Select the type of stock entry.',
      },
    },
    {
      name: 'orderReference',
      type: 'relationship',
      relationTo: 'orders',
      required: false,
      admin: {
        description: 'Select the order associated with this stock entry, if applicable.',
        condition: ({ siblingData }) => {
          return siblingData?.type === 'purchase'
        },
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      hasMany: false,
      filterOptions: ({ id, siblingData }) => {
        const filters: Record<any, any> = {
          trackInventory: {
            equals: true,
          },
          shop: {
            equals: (siblingData as any)?.shop,
          },
        }
        return filters
      },
    },
    {
      name: 'batch',
      type: 'text',
      admin: {
        description:
          'Select the batch associated with this stock entry. Required for products with expiry tracking.',
        components: {
          Field: './components/BatchField',
          Cell: './components/BatchCell', // Assuming you have a PriceCell component for displaying batch prices
        },
      },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      admin: {
        description: 'This will update product inventory and batch quantities automatically.',
        components: {
          Cell: './components/QuantityCell', // Assuming you have a QuantityCell component for displaying quantities
        },
      },
    },
    {
      name: 'fromShop',
      type: 'relationship',
      relationTo: 'shops',
      required: false,
      admin: {
        description: 'Select the shop from which this stock entry originates.',
      },
    },
    {
      name: 'toShop',
      type: 'relationship',
      relationTo: 'shops',
      required: false,
      admin: {
        description: 'Select the shop to which this stock entry is being transferred.',
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (data?.product && req?.payload) {
          try {
            const product = await req.payload.findByID({
              collection: 'products',
              id: typeof data.product === 'object' ? data.product.id : data.product,
            })

            // If product has trackExpiry, batch is required
            if (product?.trackExpiry) {
              if (!data?.batch) {
                throw new Error('Batch is required for products with expiry tracking enabled.')
              }
            }

            return seteCreatedUpdatedBy({
              data,
              operation,
              userId: req.user ? req.user.id : null,
            })
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new APIError('Error validating product settings: ' + errorMessage, 400)
          }
        }
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Automatically update product inventory and batch quantities
        if ((doc?.product || doc?.batch) && req?.payload) {
          try {
            const foundProduct = await req.payload.findByID({
              collection: 'products',
              id: typeof doc.product == 'object' ? doc.product.id : doc.product,
            })

            if (doc?.batch) {
              // Update batch quantity
              const foundBatch = await req.payload.findByID({
                collection: 'batches',
                id: doc.batch,
              })

              const quantity = doc.quantity + foundBatch?.quantity || 0

              await req.payload.update({
                collection: 'batches',
                id: doc.batch,
                data: {
                  quantity,
                },
                req,
              })
            } else {
              const quantity = doc.quantity + foundProduct?.inventory?.quantity || 0
              // Update product inventory
              await req.payload.update({
                collection: 'products',
                id: typeof doc.product == 'object' ? doc.product.id : doc.product,
                data: {
                  inventory: {
                    quantity,
                  },
                },
                req,
              })
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new APIError('Error updating stock quantities: ' + errorMessage, 500)
          }
        }
      },
    ],
  },
}

export default Stock
