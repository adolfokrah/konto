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
              type: 'select',
              defaultValue: 'product',
              options: [
                { label: 'Product', value: 'product' },
                { label: 'Service', value: 'service' },
              ],
              required: true,
              admin: {
                description: 'Select the type of item for this order.',
                condition: (_, siblingData) => {
                    return !siblingData?.productName && !siblingData?.serviceName
                }
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
                }
              },
              admin: {
                description: 'Select the service for this order item.',
                condition: (_, siblingData) => {
                  return siblingData?.type == 'service' && !siblingData?.serviceName
                },
              },
            },
            {
              name: 'serviceName',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type == 'service' && siblingData?.serviceName,
                readOnly: true,
              },
              hooks: {
                beforeChange: [
                  async ({ siblingData, req }) => {
                    if (siblingData.type && siblingData?.type == 'service') {
                      const service = await req.payload.findByID({
                        collection: 'services',
                        id: siblingData.service,
                      })
                      if (!service) {
                        throw new APIError(
                          'Service not found. Please select a valid service first.',
                          400,
                        )
                      }
                      siblingData.serviceName = service.name
                    }
                  },
                ],
              },
            },
            {
              name: 'productName',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type == 'product' && siblingData?.productName,
                readOnly: true,
              },
              hooks: {
                beforeChange: [
                  async ({ siblingData, req }) => {
                    if (siblingData.type && siblingData?.type == 'product' && siblingData?.product) {
                      const product = await req.payload.findByID({
                        collection: 'products',
                        id: siblingData.product,
                      })
                      if (!product) {
                        throw new APIError(
                          'Product not found. Please select a valid service first.',
                          400,
                        )
                      }
                      siblingData.productName = product.name
                    }
                  },
                ],
              },
            },
            {
              name: 'batchName',
              type: 'text',
              admin: {
                 condition: (_, siblingData) => siblingData?.type == 'product' && siblingData?.batchName,
                 readOnly: true,
              },
              hooks: {
                beforeChange: [
                  async ({ siblingData, req }) => {
                    if (siblingData.type && siblingData?.type == 'product' && siblingData?.batch) {
                      const batch = await req.payload.findByID({
                        collection: 'batches',
                        id: siblingData.batch,
                      })
                      if (!batch) {
                        throw new APIError(
                          'Batch not found. Please select a valid service first.',
                          400,
                        )
                      }
                      siblingData.batchName = batch.batchNumber
                    }
                  },
                ],
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
                }
              },
              admin: {
                description: 'Select the product for this order item.',
                condition: (_, siblingData) => {
                   
                  return siblingData?.type == 'product' && !siblingData?.productName
                },
              },
              hooks: {
                beforeChange: [
                  async ({ data, siblingData, operation, previousSiblingDoc, req }) => {
                    if (
                      operation === 'update' &&
                      previousSiblingDoc?.product != siblingData?.product
                    ) {
                      throw new APIError('You cannot update the prouduct once created', 400)
                    }
                    
                  },
                ],
              },
            },
            {
              name: 'batch',
              type: 'text',
              admin: {
                description: 'Enter the batch number for this product.',
                condition: (_, siblingData) => siblingData?.type == 'product' && !siblingData?.batchName,
                components: {
                  Cell: './components/BatchCell',
                  Field: './components/OrderItemBatchField.tsx',
                },
              },
              hooks: {
                beforeChange: [
                  async ({ data, siblingData, operation, req }) => {
                    if (siblingData.type && siblingData?.type == 'product') {
                      if (operation === 'create' || operation === 'update') {
                        // Only validate if product is provided and valid
                        if (!siblingData?.product) {
                          return data // Skip validation if no product selected yet
                        }

                        try {
                          const product = await req.payload.findByID({
                            collection: 'products',
                            id: siblingData.product,
                          })

                          if (!product) {
                            throw new APIError(
                              'Product not found. Please select a valid product first.',
                              400,
                            )
                          }

                          if (product.trackExpiry && !siblingData?.batch) {
                            throw new APIError(
                              `Batch field is required for product ${product?.name} that tracks expiry.`,
                              400,
                            )
                          }
                        } catch (error) {
                          // If product lookup fails, skip batch validation for now
                          if (error instanceof APIError) {
                            throw error
                          }
                          // Skip validation if product lookup fails due to other reasons
                          console.warn('Failed to validate batch field:', error)
                        }
                      }
                    }
                  },
                ],
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
                }
              },
              validate: (value: number | null | undefined) => {
                if (!value || value <= 0) {
                  return 'Quantity must be greater than zero.'
                }
                return true
              },
              hooks: {
                beforeChange: [
                  async ({ data, siblingData, operation, previousSiblingDoc, req }) => {
                    if (siblingData.type && siblingData?.type == 'product') {
                      if (
                        operation === 'update' &&
                        previousSiblingDoc?.quantity != siblingData?.quantity
                      ) {
                        throw new APIError('You cannot update the quantity once created', 400)
                      }

                      const product = await req.payload.findByID({
                        collection: 'products',
                        id: siblingData.product,
                      })

                      if (!product) {
                        throw new APIError(
                          'Product not found. Please select a valid product first.',
                          400,
                        )
                      }

                      if (
                        !product?.trackExpiry &&
                        product?.trackInventory &&
                        (product?.inventory?.quantity || 0) < siblingData?.quantity
                      ) {
                        throw new APIError(
                          `Insufficient stock for product ${product?.name}. Available stock: ${product?.inventory?.quantity || 0}`,
                          400,
                        )
                      }

                      if (product?.trackExpiry && product?.trackInventory) {
                        const foundBatch = product?.batches?.find((batch: any) => {
                          return batch.id === siblingData?.batch
                        })

                        if (!foundBatch) {
                          throw new APIError(
                            `Batch not found for product ${product?.name}. Please select a valid batch.`,
                            400,
                          )
                        }
                        if (typeof foundBatch !== 'object') {
                          throw new APIError(
                            `Invalid batch data for product ${product?.name}. Please select a valid batch.`,
                            400,
                          )
                        }
                        if ((foundBatch?.quantity || 0) < siblingData?.quantity) {
                          throw new APIError(
                            `Insufficient stock for batch ${foundBatch?.batchNumber} of product ${product?.name}. Available stock: ${foundBatch?.quantity}`,
                            400,
                          )
                        }
                        console.log('Validating batch for product:', product?.name)
                      }
                    } else {
                      console.log('Skipping batch validation for service type')
                      siblingData.batch = undefined
                      siblingData.product = undefined
                    }
                  },
                ],
                afterChange: [
                  async ({ siblingData, operation, previousSiblingDoc, req }) => {
                    if (siblingData?.type && siblingData?.type == 'product') {
                      const product = await req.payload.findByID({
                        collection: 'products',
                        id: siblingData.product,
                      })
                      if (!product) {
                        throw new APIError(
                          'Product not found. Please select a valid product first.',
                          400,
                        )
                      }

                      if (
                        operation === 'update' &&
                        !previousSiblingDoc?.isReturned &&
                        siblingData?.isReturned
                      ) {
                        const quantity = siblingData?.quantity || 0
                        if (product?.trackInventory && product?.inventory?.quantity) {
                          const newQuantity = product.inventory.quantity + quantity
                          await req.payload.update({
                            collection: 'products',
                            id: product.id,
                            data: {
                              inventory: {
                                quantity: newQuantity,
                              },
                            },
                          })
                        }
                        if (product?.trackExpiry && product?.trackInventory) {
                          const foundBatch = product?.batches?.find((batch: any) => {
                            return batch.id === siblingData?.batch
                          })
                          if (typeof foundBatch !== 'object') {
                            throw new APIError(
                              `Invalid batch data for product ${product?.name}. Please select a valid batch.`,
                              400,
                            )
                          }
                          if (foundBatch && foundBatch.quantity) {
                            const newBatchQuantity = foundBatch.quantity + quantity
                            await req.payload.update({
                              collection: 'batches',
                              id: siblingData.batch,
                              data: {
                                quantity: newBatchQuantity,
                              },
                            })
                          }
                        }
                      } else if (operation === 'create') {
                        if (product?.trackInventory && product?.inventory?.quantity) {
                          const quantity = siblingData?.quantity || 0
                          const newQuantity = product.inventory.quantity - quantity
                          await req.payload.update({
                            collection: 'products',
                            id: product.id,
                            data: {
                              inventory: {
                                quantity: newQuantity,
                              },
                            },
                          })
                        }
                        if (product?.trackExpiry && product?.trackInventory) {
                          const foundBatch = product?.batches?.find((batch: any) => {
                            return batch.id === siblingData?.batch
                          })
                          if (typeof foundBatch !== 'object') {
                            throw new APIError(
                              `Invalid batch data for product ${product?.name}. Please select a valid batch.`,
                              400,
                            )
                          }
                          if (foundBatch && foundBatch.quantity) {
                            const quantity = siblingData?.quantity || 0
                            const newBatchQuantity = foundBatch.quantity - quantity
                            await req.payload.update({
                              collection: 'batches',
                              id: siblingData.batch,
                              data: {
                                quantity: newBatchQuantity,
                              },
                            })
                          }
                        }
                      }
                    }
                  },
                ],
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
              hooks: {
                beforeChange: [
                  async ({ data, siblingData, operation, previousSiblingDoc }) => {
                    if (
                      operation === 'update' &&
                      previousSiblingDoc?.isReturned &&
                      !siblingData?.isReturned
                    ) {
                      throw new APIError(
                        'You cannot un-return an item once it has been marked as returned',
                        400,
                      )
                    }
                  },
                ],
              },
            },
          ],
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, siblingData, operation, previousSiblingDoc }) => {
            if (
              operation === 'update' &&
              previousSiblingDoc?.items.length != siblingData?.items.length
            ) {
              throw new APIError('You cannot update the list of items once created', 400)
            }
          },
        ],
      },
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
              siblingData.amountPaid =
                siblingData?.items?.reduce((acc: number, item: any) => {
                  return acc + item.quantity * item.unitPrice
                }, 0) -
                calculateDiscount(
                  siblingData?.discount || 0,
                  siblingData?.disountType,
                  siblingData?.items?.reduce((acc: number, item: any) => {
                    return acc + item.quantity * item.unitPrice
                  }, 0),
                )
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
