import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'

import { type CollectionConfig } from 'payload'

import { validateAmountPaid } from './hooks/amountPaid'
import { createStockRecordsForSales, validateOrderItemsAndSetCreatedUpdatedBy } from './hooks/index'
import { handlePaymentChange } from './hooks/payment'
import { validateQuantity } from './hooks/quantity'
import { calculateTotalCost } from './hooks/totalCost'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    read: () => true,
    delete: () => false,
  },
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'shop',
      type: 'relationship',
      relationTo: 'shops',
      required: true,
      admin: {
        description: 'Select the shop associated with this order.',
        components: {
          Field: '@collections/Orders/components/OrderItemShopField.tsx',
        },
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Enter the date when the order was placed.',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: {
        condition: ({ shop }) => {
          return Boolean(shop)
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'text',
              required: true,
              admin: {
                description: 'Select the type of item for this order.',
                components: {
                  Field: '@collections/Orders/components/OrderItemServiceTypeSelector.tsx',
                },
              },
            },
            {
              name: 'service',
              type: 'relationship',
              relationTo: 'services',
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
                description: 'Select the service for this order item.',
                condition: (_, siblingData) => siblingData?.type == 'service',
                components: {
                  Field: '@collections/Orders/components/OrderItemServiceField.tsx',
                },
              },
            },
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
                condition: (_, siblingData) => siblingData?.type == 'product',
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
                  Field: '@collections/Orders/components/OrderItemQuantityField.tsx',
                },
              },
              hooks: {
                beforeChange: [validateQuantity],
              },
            },
            {
              name: 'unitPrice',
              type: 'number',
              required: true,
              admin: {
                description: 'Enter the price of the product per unit.',
                readOnly: true,
                components: {
                  Field: '@collections/Orders/components/OrderItemUnitPriceField.tsx',
                },
              },
            },
            {
              name: 'totalPrice',
              type: 'number',
              admin: {
                description: 'Enter the price of the product at the time of order.',
                readOnly: true,
                components: {
                  Field: '@collections/Orders/components/OrderItemTotalPriceField.tsx',
                },
              },
            },
            // {
            //   name: 'isReturned',
            //   type: 'checkbox',
            //   defaultValue: false,
            //   admin: {
            //     description: 'Check if this item was returned.',
            //     condition: (_, siblingData) => {
            //       return siblingData?.type === 'product'
            //     },
            //   },
            // },
            {
              name: 'quantityReturned',
              type: 'number',
              required: false,
              defaultValue: 0,
              admin: {
                description: 'Enter the quantity of the product returned.',
                components: {
                  Field: '@collections/Orders/components/OrderItemReturnField.tsx',
                },
                condition: (_, siblingData) => {
                  return siblingData?.type === 'product'
                }, // Only show if type is product
              },
            },
            {
              name: 'originalQuantityAtPurchase',
              type: 'number',
              required: false,
              admin: {
                description: 'The original quantity of the product at the time of purchase.',
                readOnly: true,
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
              name: 'serviceMetadataAtPurchase',
              type: 'json',
              admin: {
                description: 'The name of the service at the time of purchase.',
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
      name: 'disountType',
      type: 'select',
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
      ],
      required: false,
    },
    {
      name: 'discount',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Enter the discount amount for this order.',
        condition: ({ disountType }) => {
          return disountType === 'fixed' || disountType === 'percentage'
        },
      },
    },
    {
      name: 'totalCost',
      type: 'number',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [calculateTotalCost],
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
      hooks: {
        beforeChange: [handlePaymentChange],
      },
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
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      admin: {
        description: 'Select the customer associated with this order.',
        components: {
          Field: '@collections/Orders/components/OrderItemCustomerField.tsx',
        },
      },
    },
    {
      name: 'customerMetadataAtPurchase',
      type: 'json',
      admin: {
        description: 'The customer details at the time of purchase.',
        readOnly: true,
        condition: () => false, // This field is not editable in the UI
      },
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    afterChange: [createStockRecordsForSales],
    beforeValidate: [validateOrderItemsAndSetCreatedUpdatedBy],
  },
}
