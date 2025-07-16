import { type CollectionBeforeValidateHook, type CollectionAfterChangeHook } from 'payload'
import { seteCreatedUpdatedBy } from '@/collections/hooks/set_created_updated_by'

export const beforeValidateHook: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Automatically set createdBy to the current user

  if (data?.status === 'inactive') {
    data.batches = [] // Clear batches if product is inactive
  }

  return seteCreatedUpdatedBy({
    data,
    operation,
    userId: req.user ? req.user.id : null,
  })
}

export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, operation, req, previousDoc }) => {
  // Custom logic after product change
  if (
    (operation === 'update' || operation === 'create') &&
    doc.trackInventory &&
    doc.trackExpiry &&
    doc.batches
  ) {
    // Update the product field in all linked batches
    const payload = req.payload

    // Get all batches linked to this product
    const batches = Array.isArray(doc.batches) ? doc.batches : [doc.batches]
    const previousBatches = Array.isArray(previousDoc?.batches)
      ? previousDoc.batches
      : [previousDoc?.batches]

    // Update each batch to set the product reference
    if (doc.status === 'inactive' && operation === 'update') {
      for (const batch of previousBatches) {
        const batchId = typeof batch === 'string' ? batch : batch.id
        try {
          await payload.update({
            collection: 'batches',
            id: batchId,
            data: {
              product: null, // Clear product reference if product is inactive
            },
            req,
          })
        } catch (error) {
          console.error(`Failed to clear product reference for batch ${batchId}:`, error)
        }
      }
    } else {
      for (const batch of batches) {
        const batchId = typeof batch === 'string' ? batch : batch.id
        try {
          await payload.update({
            collection: 'batches',
            id: batchId,
            data: {
              product: doc.id,
            },
            req,
          })
        } catch (error) {
          console.error(`Failed to update batch ${batchId}:`, error)
        }
      }
    }
  }
}
