import { seteCreatedUpdatedBy } from '@/lib/utils/set_created_updated_by'

import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeValidateHook,
} from 'payload'

export const validateOrderItemsAndSetCreatedUpdatedBy: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (data?.items && data?.items.length > 0) {
    if (operation === 'create') {
      for (const item of data.items) {
        if (item?.type === 'service') {
          const service = await req.payload.findByID({
            collection: 'services',
            id: item.service,
          })
          if (!service) {
            throw new APIError('Service not found. Please select a valid service first.', 400)
          }
          //keep service data for history audit
          item.serviceMetadataAtPurchase = { ...service }
        }
        if (item?.type === 'product') {
          if (!item?.product) {
            throw new APIError('Product is required for order items of type "product".', 400)
          }

          const productList = await req.payload.find({
            collection: 'products',
            where: {
              id: {
                equals:
                  typeof item.product === 'string'
                    ? item.product
                    : item.product?.id || item.product,
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
          item.productMetadataAtPurchase = { ...product }

          if (product.trackExpiry && !item.batch) {
            throw new APIError(
              `Batch field is required for product ${product.name} that tracks expiry.`,
              400
            )
          }

          if (product.trackInventory && product.inventory?.quantity) {
            if (item.quantity > product.inventory?.quantity) {
              throw new APIError(
                `Insufficient stock for product ${product.name}. Available stock: ${product.inventory?.quantity || 0}`,
                400
              )
            } else {
              //after change will insert stock record
            }
          }

          if (product.trackExpiry && product.trackInventory) {
            const foundBatch = product.batches?.find((batch: any) => batch.id === item.batch)

            if (!foundBatch || typeof foundBatch !== 'object') {
              throw new APIError(
                `Invalid batch data for product ${product.name}. Please select a valid batch.`,
                400
              )
            }
            //keep batch data for history audit
            item.batchMetadataAtPurchase = { ...foundBatch }

            if (new Date(foundBatch.expiryDate) < new Date()) {
              throw new APIError(
                `Batch ${foundBatch.batchNumber} of product ${product.name} has expired.`,
                400
              )
            }

            if ((foundBatch.quantity || 0) < item.quantity) {
              throw new APIError(
                `Insufficient stock for batch ${foundBatch.batchNumber} of product ${product.name}. Available stock: ${foundBatch.quantity}`,
                400
              )
            }
            //afeter change will insert stock record
          }
        }
      }

      if (data.customer) {
        const customer = await req.payload.findByID({
          collection: 'customers',
          id: data.customer,
        })
        if (!customer) {
          throw new APIError('Customer not found. Please select a valid customer first.', 400)
        }
        //keep customer data for history audit
        data.customerMetadataAtPurchase = { ...customer }
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
          const foundPreviousItem = previousItems.find((prevItem: any) => prevItem.id === item.id)

          if (operation === 'update' && !item.isReturned) {
            if (foundPreviousItem?.isReturned) {
              throw new APIError(
                'You cannot un-return an item once it has been marked as returned',
                400
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
                    equals:
                      typeof item.product === 'string'
                        ? item.product
                        : item.product?.id || item.product,
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
                await req.payload.create({
                  collection: 'stock',
                  data: {
                    shop: data.shop,
                    product: product.id,
                    type: 'return',
                    quantity: Number(item.quantity),
                    orderReference: originalDoc.id,
                  },
                  req,
                })
              }

              if (product.trackExpiry && product.trackInventory) {
                const foundBatch = product.batches?.find((batch: any) => batch.id === item.batch)
                if (!foundBatch || typeof foundBatch !== 'object') {
                  continue
                }

                await req.payload.create({
                  collection: 'stock',
                  data: {
                    shop: data.shop,
                    product: product.id,
                    type: 'return',
                    quantity: Number(item.quantity),
                    orderReference: originalDoc.id,
                    batch:
                      typeof item.batch === 'string' ? item.batch : item.batch?.id || item.batch,
                  },
                  req,
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
}

export const createStockRecordsForSales: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation === 'create') {
    for (const item of doc.items) {
      if (item?.type == 'product') {
        const product = await req.payload.findByID({
          collection: 'products',
          id: typeof item.product === 'string' ? item.product : item.product?.id || item.product,
        })
        if (!product) continue

        if (product?.trackInventory) {
          if (item?.batch) {
            await req.payload.create({
              collection: 'stock',
              data: {
                shop: doc.shop,
                product: product.id,
                type: 'sale',
                quantity: -Number(item.quantity),
                orderReference: doc.id,
                batch: typeof item.batch === 'string' ? item.batch : item.batch?.id || item.batch,
              },
              req,
            })
          } else {
            await req.payload.create({
              collection: 'stock',
              data: {
                shop: doc.shop,
                product: product.id,
                type: 'sale',
                quantity: -Number(item.quantity),
                orderReference: doc.id,
              },
              req,
            })
          }
        }
      }
    }
  }
}
