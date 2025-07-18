import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'

import { CollectionConfig } from 'payload'

import { validateAmountPaid } from './hooks/amountPaid'
import { setProductAndBatchMetadata, updateProductStockAndCostPrice } from './hooks/index'

const Expenses: CollectionConfig = {
  slug: 'expenses',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['id', 'description', 'amount', 'category', 'date', 'shop'],
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the expense was incurred.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
      admin: {
        description: 'Shop where the expense was incurred.',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: true,
      admin: {
        description: 'Brief description of the expense.',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Office Supplies',
          value: 'office-supplies',
        },
        {
          label: 'Utilities',
          value: 'utilities',
        },
        {
          label: 'Marketing',
          value: 'marketing',
        },
        {
          label: 'Travel',
          value: 'travel',
        },
        {
          label: 'Equipment',
          value: 'equipment',
        },
        {
          label: 'Maintenance',
          value: 'maintenance',
        },
        {
          label: 'Inventory',
          value: 'inventory',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      admin: {
        description: 'Type of the expense.',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: {
        description: 'List of items associated with the expense.',
        condition: ({ type }) => {
          return type === 'inventory'
        },
      },
      fields: [
        {
          type: 'row',
          required: true,
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
              filterOptions: ({ data }) => {
                return {
                  shop: {
                    equals: (data as any).shop,
                  },
                  status: {
                    equals: 'active',
                  },
                }
              },
              admin: {
                description: 'Select the product for this order item.',
                components: {
                  Field: '@collections/components/ItemProductField.tsx',
                },
              },
            },
            {
              name: 'batch',
              type: 'relationship',
              relationTo: 'batches',
              filterOptions: ({ siblingData }) => {
                return {
                  product: {
                    equals: (siblingData as any).product,
                  },
                  status: {
                    equals: 'active',
                  },
                  expiryDate: {
                    greater_than: new Date().toISOString(), // Filter out expired batches
                  },
                }
              },
              admin: {
                description:
                  'Select a batch for this product. Batches are sorted by expiry date (FIFO - First to expire first).',
                components: {
                  Cell: '@collections/components/BatchCell',
                  Field: '@collections/components/ItemBatchField.tsx',
                },
                // Note: FIFO sorting (earliest expiry first) should be implemented in the custom Field component
                // or by modifying the Batches collection's default sort order
              },
            },
            {
              name: 'quantity',
              type: 'number',
              required: true,
              admin: {
                description: 'Enter the quantity of the product ordered.',
                components: {
                  Field: '@collections/Expenses/components/ItemQuantityField.tsx',
                },
              },
              validate: (value: number | null | undefined) => {
                if (!value || value <= 0) {
                  return 'Quantity must be greater than zero.'
                }
                return true
              },
            },
            {
              name: 'cost',
              type: 'number',
              required: true,
              admin: {
                description: 'Enter the price of the product at the time of order.',
              },
            },
            {
              name: 'supplier',
              type: 'relationship',
              relationTo: 'suppliers',
              filterOptions: ({ data }) => {
                return {
                  shop: {
                    equals: (data as any).shop,
                  },
                  status: {
                    equals: 'active',
                  },
                }
              },
              admin: {
                description: 'Select the supplier for this product.',
              },
            },
            {
              name: 'productMetadataAtPurchase',
              type: 'json',
              admin: {
                description: 'The name of the product at the time of purchase.',
                readOnly: true,
                condition: () => false,
              },
            },
            {
              name: 'batchMetadataAtPurchase',
              type: 'json',
              admin: {
                description:
                  'The batch number and expiry date of the product at the time of purchase.',
                readOnly: true,
                condition: () => false,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'updateStock',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Update stock levels for the purchased items.',
        condition: ({ type }) => {
          return type === 'inventory'
        },
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Amount spent.',
        step: 0.01,
        condition: ({ type }) => {
          return type !== 'inventory'
        },
      },
    },
    {
      name: 'payment',
      type: 'select',
      required: true,
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Partial', value: 'partial' },
        { label: 'Un Paid', value: 'un_paid' },
      ],
    },
    {
      name: 'amountPaid',
      type: 'number',
      required: true,
      admin: {
        description: 'Enter the amount paid for this order.',
        condition: ({ payment }) => {
          return payment === 'partial'
        },
      },
      hooks: {
        beforeChange: [validateAmountPaid],
      },
    },
    {
      name: 'fullAmountDueOn',
      type: 'date',
      required: true,
      admin: {
        description: 'Enter the date when the full amount is due.',
        condition: ({ payment }) => payment === 'partial' || payment === 'un_paid',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'Cash', value: 'cash' },
        { label: 'Card', value: 'card' },
        { label: 'Mobile Money', value: 'mobile-money' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
      ],
      required: true,
      admin: {
        description: 'Select the payment method for this order.',
        condition: ({ payment }) => {
          return payment === 'paid' || payment === 'partial'
        },
      },
    },
    {
      name: 'receipt',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Upload receipt or supporting document.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Additional notes about the expense.',
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    afterChange: [updateProductStockAndCostPrice],
    beforeValidate: [setProductAndBatchMetadata],
  },
}

export default Expenses
