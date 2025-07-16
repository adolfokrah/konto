import { CollectionBeforeValidateHook } from 'payload'
import { seteCreatedUpdatedBy } from '@collectionHooks/set_created_updated_by'

export const setCreatedUpdatedBy: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Automatically set createdBy to the current user
  return seteCreatedUpdatedBy({
    data,
    operation,
    userId: req.user ? req.user.id : null,
  })
}
