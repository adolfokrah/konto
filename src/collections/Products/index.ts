// collections/Products.ts
import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { CollectionConfig } from 'payload'
import { validateUniqueBarcode } from './hooks/barcode'
import { validateStockAlert } from './hooks/stockAlert'
import { setCreatedUpdatedByAndClearBatchesWhenInactive, syncBatchProductReferences } from './hooks/index'

const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'id',
      'name',
      'image',
      'color',
      'shop',
      'trackInventory',
      'trackExpiry',
      'batch',
      'inventory > quantity',
      'inventory > stockAlert',
      'status',
    ],
  },
  access: {
    read: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media', // Assuming you have a Media collection for images
      required: false,
      admin: {
        description: 'Upload an image for the product',
      },
    },
    {
      name: 'color',
      type: 'text',
      required: false,
      admin: {
        description: 'A color code for the category, e.g., #FF5733 for red.',
        components: {
          Cell: '@collectionComponents/ColorCell', // Assuming you have a ColorCell component for displaying colors
        },
        condition: (data, siblingData) => {
          return !siblingData.image
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'barcode',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [validateUniqueBarcode],
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'prodSellingType',
      type: 'select',
      required: true,
      defaultValue: 'retail',
      options: [
        { label: 'Retail', value: 'retail' },
        { label: 'Wholesale', value: 'wholesale' },
      ],
    },
    {
      name: 'unit',
      type: 'text',
      required: false,
      admin: {
        description: 'e.g. Bottle, Piece, Bowl Pack, Box, etc.',
      },
    },
    {
      name: 'quantityPerWholesaleUnit',
      type: 'number',
      required: false,

      admin: {
        description: 'e.g. 1 pack = 12 bottles',
        condition: ({ prodSellingType }) => {
          // Show this field only if the product is sold wholesale
          return prodSellingType === 'wholesale'
        },
      },
    },
    {
      name: 'costPricePerUnit',
      type: 'number',
      required: true,
    },
    {
      name: 'sellingPricePerUnit',
      type: 'number',
      required: true,
    },
    {
      name: 'trackInventory',
      type: 'checkbox',
      label: 'Track Inventory',
      defaultValue: true,
    },
    {
      name: 'trackExpiry',
      type: 'checkbox',
      label: 'Track Expiry',
      defaultValue: false,
      admin: {
        description: 'Enable this if the product has an expiry date',
        condition: ({ trackInventory }) => {
          // Show this field only if inventory tracking is enabled
          return trackInventory
        },
      },
    },
    {
      name: 'inventory',
      type: 'group',
      admin: {
        condition: ({ trackInventory, trackExpiry }) => {
          // Show this field only if inventory tracking is enabled
          return trackInventory && !trackExpiry
        },
      },
      fields: [
        {
          name: 'quantity',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true, // Prevent manual editing of quantity
            description:
              'This field is automatically updated based on the product inventory from stock updates.',
            components: {
              Cell: '@collectionComponents/QuantityCell', // Assuming you have a QuantityCell component for displaying quantities
            },
          },
        },
        {
          name: 'stockAlert',
          type: 'number',
          required: true,
          admin: {
            description: 'Alert when stock falls below this level',
          },
          validate: validateStockAlert,
        },
      ],
    },
    {
      name: 'batches',
      type: 'relationship',
      relationTo: 'batches',
      hasMany: true,
      filterOptions: ({ id, siblingData }) => {
        // Filter to show only batches that are either unlinked or already linked to this product
        const filters: { or: any } = {
          or: [
            {
              product: {
                exists: false, // Show batches that are not linked to any product
              },
            },
            {
              shop: {
                equals: (siblingData as any)?.shop, // Filter by the current shop
              },
            },
            {
              status: {
                equals: 'active', // Show only active batches
              },
            },
          ],
        }
        // Only add product filter if ID is valid
        if (id && id !== 'undefined' && !isNaN(Number(id))) {
          filters.or.push({
            product: {
              equals: id, // Safe to use ID here
            },
          })
        }
        return filters
      },
      admin: {
        description: 'Link to batches for inventory and expiry tracking',
        condition: ({ trackInventory, trackExpiry }) => {
          // Show this field only if inventory tracking is enabled
          return trackInventory && trackExpiry
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      defaultValue: 'active',
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [setCreatedUpdatedByAndClearBatchesWhenInactive],
    afterChange: [syncBatchProductReferences],
  },
}

export default Products
