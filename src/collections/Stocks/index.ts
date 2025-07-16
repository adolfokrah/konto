// collections/Products.ts
import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { type CollectionConfig } from 'payload'
import { beforeValidateHook, afterChangeHook } from './hooks'

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
        condition: ({ type }) => {
          console.log('siblingData', type)
          return type === 'sale'
        },
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      hasMany: false,
      filterOptions: ({  siblingData }) => {
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
          Field: '@collectionComponents/BatchField',
          Cell: '@collectionComponents/BatchCell', // Assuming you have a PriceCell component for displaying batch prices
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
          Cell: '@collectionComponents/QuantityCell', // Assuming you have a QuantityCell component for displaying quantities
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
    beforeValidate: [beforeValidateHook],
    afterChange: [afterChangeHook],
  },
}

export default Stock
