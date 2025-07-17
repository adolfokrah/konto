import { seteCreatedUpdatedBy } from '@/lib/utils/set_created_updated_by'

import { APIError, CollectionAfterChangeHook, CollectionBeforeValidateHook } from 'payload'

export const validateProductBatchAndSetCreatedUpdatedBy: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
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
}

export const updateInventoryAndBatchQuantities: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Automatically update product inventory and batch quantities
  if ((doc?.product || doc?.batch) && req?.payload && operation === 'create') {
    try {
      const foundProduct = await req.payload.findByID({
        collection: 'products',
        id: typeof doc.product == 'object' ? doc.product.id : doc.product,
      })

      let quantity = 0

      if (doc?.batch) {
        // Update batch quantity
        const foundBatch = await req.payload.findByID({
          collection: 'batches',
          id: doc.batch,
        })

        quantity = doc.quantity + foundBatch?.quantity || 0

        await req.payload.update({
          collection: 'batches',
          id: doc.batch,
          data: {
            quantity,
          },
          req,
        })
      } else {
        quantity = doc.quantity + foundProduct?.inventory?.quantity || 0
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

      await req.payload.update({
        collection: 'stock',
        id: doc.id,
        data: {
          newQuantity: quantity,
        },
        req,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new APIError('Error updating stock quantities: ' + errorMessage, 500)
    }
  }
}
