import { seteCreatedUpdatedBy } from '@/lib/utils/set_created_updated_by'

import { APIError, CollectionAfterChangeHook, type CollectionBeforeValidateHook } from 'payload'

export const updateProductStockAndCostPrice: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (doc?.items && doc?.items.length > 0 && doc?.updateStock) {
    if (operation === 'create') {
      for (const item of doc.items) {
        const product = await req.payload.findByID({
          collection: 'products',
          id: typeof item.product === 'string' ? item.product : item.product?.id || item.product,
        })

        if (!product) continue

        if (product?.trackInventory) {
          await req.payload.create({
            collection: 'stock',
            data: {
              shop: doc.shop,
              product: product.id,
              type: 'purchase',
              quantity: Number(item.quantity),
              expenseReference: doc.id,
              batch:
                typeof item.batch === 'string' ? item.batch : item.batch?.id || item.batch || null,
            },
            req,
          })
        }
      }
    }
  }
}

export const setProductAndBatchMetadata: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
  originalDoc,
}) => {
  if (operation === 'update') {
    if (originalDoc?.type != data?.type) {
      throw new APIError('Cannot change the type of an expense', 400)
    }

    if (
      data?.type == 'inventory' &&
      originalDoc &&
      originalDoc?.items?.length != data?.items?.length
    ) {
      throw new APIError('Cannot change the number of items in an expense', 400)
    }
  }
  if (data?.items && data?.items.length > 0) {
    for (const item of data.items) {
      const product = await req.payload.findByID({
        collection: 'products',
        id: typeof item.product === 'string' ? item.product : item.product?.id || item.product,
      })
      if (!product) {
        throw new APIError('Product not found', 404)
      }

      item.productMetadataAtPurchase = { ...product }
      item.batchMetadataAtPurchase =
        product?.trackExpiry && item.batch
          ? product?.batches?.find(
              batch =>
                (typeof batch === 'string' ? batch : batch.id) ==
                (typeof item.batch === 'string' ? item.batch : item.batch?.id || item.batch)
            )
          : null
    }
  }

  // Automatically set createdBy to the current user
  return seteCreatedUpdatedBy({
    data,
    operation,
    userId: req.user ? req.user.id : null,
  })
}
