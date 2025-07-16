import { Order } from '@/payload-types'
import { APIError, type CollectionConfig } from 'payload'
import { seteCreatedUpdatedBy } from './hooks/set_created_updated_by'
import { CREATED_UPDATED_BY_FIELDS } from '@/constants/users'
import { calculateDiscount } from '@/lib/utils/calculateDiscount'

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
                  Field: './components/OrderItemServiceTypeSelector.tsx',
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
                  Field: './components/OrderItemServiceField.tsx',
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
                  Field: './components/OrderItemProductField.tsx',
                },
              },
            },
            {
              name: 'batch',
              type: 'relationship',
              relationTo: 'batches',
              filterOptions: ({ data, siblingData }) => {
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
                  Cell: './components/BatchCell',
                  Field: './components/OrderItemBatchField.tsx',
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
                  Field: './components/OrderItemQuantityField.tsx',
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
              name: 'unitPrice',
              type: 'number',
              required: true,
              admin: {
                description: 'Enter the price of the product per unit.',
                readOnly: true,
                components: {
                  Field: './components/OrderItemUnitPriceField.tsx',
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
                  Field: './components/OrderItemTotalPriceField.tsx',
                },
              },
            },
            {
              name: 'isReturned',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Check if this item was returned.',
                condition: (_, siblingData) => {
                  return siblingData?.type === 'product'
                },
              },
            },
           {
              name: 'productMetadataAtPurchase',
              type: 'json',
              admin: {
                description: 'The name of the product at the time of purchase.',
                readOnly: true, 
                condition: ()=>false
              }
            },
            {
              name: 'serviceMetadataAtPurchase',
              type: 'json',
              admin: {
                description: 'The name of the service at the time of purchase.',
                readOnly: true,
                condition: ()=>false
              }
            },
            {
              name: 'batchMetadataAtPurchase',
              type: 'json',
              admin: {
                description: 'The batch number and expiry date of the product at the time of purchase.',
                readOnly: true,
                condition: ()=>false
              }
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
        beforeChange: [
          async ({ siblingData }) => {
            const orederItems = siblingData?.items as Order['items']
            const items =
              orederItems
                ?.filter((item) => !item?.isReturned)
                .map((item) => item.quantity * item.unitPrice) || []
            let totalAmount = items.reduce((acc, item) => acc + item, 0)
            totalAmount =
              totalAmount -
              calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

            siblingData.totalCost = totalAmount
          },
        ],
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
        beforeChange: [
          async ({ data, siblingData, operation }) => {
            if (siblingData?.payment === 'un_paid') {
              siblingData.amountPaid = 0
            }
            if (siblingData?.payment === 'paid') {
              const orederItems = siblingData?.items as Order['items']
              const items =
                orederItems
                  ?.filter((item) => !item?.isReturned)
                  .map((item) => item.quantity * item.unitPrice) || []

              let totalAmount = items.reduce((acc, item) => acc + item, 0)

              siblingData.amountPaid =
                totalAmount -
                calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)
            }
          },
        ],
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
        beforeChange: [
          async ({ data, siblingData, operation }) => {
            const orederItems = siblingData?.items as Order['items']
            const items =
              orederItems
                ?.filter((item) => !item?.isReturned)
                .map((item) => item.quantity * item.unitPrice) || []

            let totalAmount = items.reduce((acc, item) => acc + item, 0)
            totalAmount =
              totalAmount -
              calculateDiscount(siblingData?.discount || 0, siblingData?.disountType, totalAmount)

            if (siblingData.amountPaid > totalAmount) {
              throw new APIError(
                `Amount paid cannot be greater than order amount of ${totalAmount}`,
                400,
              )
            } else if (siblingData.amountPaid == totalAmount) {
              siblingData.payment = 'paid'
            }
          },
        ],
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
      name: 'paymentMothod',
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
          Field: './components/OrderItemCustomerField.tsx',
        }
      }
    },
    {
      name: 'customerMetadataAtPurchase',
      type: 'json',
      admin: {
        description: 'The customer details at the time of purchase.',
        readOnly: true,
        condition: () => false, // This field is not editable in the UI 
      }
    },
    ...CREATED_UPDATED_BY_FIELDS,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        if (data?.items && data?.items.length > 0) {
          if (operation === 'create') {
            for (const item of data.items) {
              if(item?.type === 'service') {
                const service = await req.payload.findByID({
                  collection: 'services',
                  id: item.service,
                })
                if (!service) {
                  throw new APIError('Service not found. Please select a valid service first.', 400)
                }
                //keep service data for history audit
                item.serviceMetadataAtPurchase = {...service}
              }
              if (item?.type === 'product') {
                if (!item?.product) {
                  throw new APIError('Product is required for order items of type "product".', 400)
                }

                const productList = await req.payload.find({
                  collection: 'products',
                  where: {
                    id: {
                      equals: item.product,
                    },
                    status: {
                      equals: 'active',
                    },
                  },
                })

                const product = productList?.docs?.[0]
                if (!product) {
                  throw new APIError('Product not found. Please select a valid product first.', 400)
                }

                //keep product data for history audit
                item.productMetadataAtPurchase = {...product}


                if (product.trackExpiry && !item.batch) {
                  throw new APIError(
                    `Batch field is required for product ${product.name} that tracks expiry.`,
                    400,
                  )
                }

                if (product.trackInventory && product.inventory?.quantity) {
                  if (item.quantity > product.inventory?.quantity) {
                    throw new APIError(
                      `Insufficient stock for product ${product.name}. Available stock: ${product.inventory?.quantity || 0}`,
                      400,
                    )
                  } else {
                    await req.payload.update({
                      collection: 'products',
                      id: product.id,
                      data: {
                        inventory: {
                          quantity: Number(product.inventory.quantity) - Number(item.quantity),
                        },
                      },
                    })
                  }
                }

                if (product.trackExpiry && product.trackInventory) {
                  const foundBatch = product.batches?.find((batch: any) => batch.id === item.batch)

                
                  if (!foundBatch || typeof foundBatch !== 'object') {
                    throw new APIError(
                      `Invalid batch data for product ${product.name}. Please select a valid batch.`,
                      400,
                    )
                  }
                  //keep batch data for history audit
                  item.batchMetadataAtPurchase = {...foundBatch}

                  if (new Date(foundBatch.expiryDate) < new Date()) {
                    throw new APIError(
                      `Batch ${foundBatch.batchNumber} of product ${product.name} has expired.`,
                      400,
                    )
                  }

                  if ((foundBatch.quantity || 0) < item.quantity) {
                    throw new APIError(
                      `Insufficient stock for batch ${foundBatch.batchNumber} of product ${product.name}. Available stock: ${foundBatch.quantity}`,
                      400,
                    )
                  }

                  await req.payload.update({
                    collection: 'batches',
                    id: item.batch,
                    data: {
                      quantity: Number(foundBatch.quantity) - Number(item.quantity),
                    },
                  })
                }
              }
            }

            if(data.customer){
              const customer = await req.payload.findByID({
                collection: 'customers',
                id: data.customer,
              })
              if (!customer) {
                throw new APIError('Customer not found. Please select a valid customer first.', 400)
              }
              //keep customer data for history audit
              data.customerMetadataAtPurchase = {...customer}
            }
          } else if (operation === 'update' && req) {
            const order = await req.payload.findByID({
              collection: 'orders',
              id: originalDoc?.id,
              depth: 0,
            })
            if (!order) {
              throw new APIError('Order not found.', 404)
            }
            const previousItems = order.items || []

            if (previousItems.length != data.items.length) {
              throw new APIError('You cannot change the number of items in an order.', 400)
            }

            for (const item of data.items) {
              if (item?.type === 'product') {
                const foundPreviousItem = previousItems.find(
                  (prevItem: any) => prevItem.id === item.id,
                )

                if (operation === 'update' && !item.isReturned) {
                  if (foundPreviousItem?.isReturned) {
                    throw new APIError(
                      'You cannot un-return an item once it has been marked as returned',
                      400,
                    )
                  }
                }

                if (foundPreviousItem?.product !== item.product) {
                  throw new APIError('You cannot change the product of an order item.', 400)
                }

                if (operation === 'update' && item?.isReturned) {
                  if (!foundPreviousItem?.isReturned) {
                    const productList = await req.payload.find({
                      collection: 'products',
                      where: {
                        id: {
                          equals: item.product,
                        },
                        status: {
                          equals: 'active',
                        },
                      },
                    })

                    const product = productList?.docs?.[0]
                    if (!product) {
                      continue
                    }

                    if (product.trackInventory && product.inventory?.quantity) {
                      await req.payload.update({
                        collection: 'products',
                        id: product.id,
                        data: {
                          inventory: {
                            quantity: Number(product.inventory.quantity) + Number(item.quantity),
                          },
                        },
                      })
                    }

                    if (product.trackExpiry && product.trackInventory) {
                      const foundBatch = product.batches?.find(
                        (batch: any) => batch.id === item.batch,
                      )
                      if (!foundBatch || typeof foundBatch !== 'object') {
                        continue
                      }
                      await req.payload.update({
                        collection: 'batches',
                        id: item.batch,
                        data: {
                          quantity: Number(foundBatch.quantity) + Number(item.quantity),
                        },
                      })
                    }
                  }
                }
              }
            }
          }
        }


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
