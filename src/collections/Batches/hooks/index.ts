import { type CollectionBeforeValidateHook, type CollectionAfterChangeHook } from 'payload'
import { seteCreatedUpdatedBy } from '@/lib/utils/set_created_updated_by'

export const setCreatedUpdatedByAndResetProductWhenInactive: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (data?.status === 'inactive') {
    data.product = null // Reset product relationship if batch is inactive
  }
  // Automatically set createdBy to the current user
  return seteCreatedUpdatedBy({
    data,
    operation,
    userId: req.user ? req.user.id : null,
  })
}

export const clearProductReferenceWhenInactive: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation === 'create' || operation === 'update') {
    if (doc?.status == 'inactive' && doc?.product) {
      const product = await req.payload.findByID({
        collection: 'products',
        id: doc.product,
      })
      if (product) {
        // Reset the product reference in the batch
        await req.payload.update({
          collection: 'batches',
          id: doc.id,
          data: {
            product: null,
          },
        })
      }
    }
  }
}
