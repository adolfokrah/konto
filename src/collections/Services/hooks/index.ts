import { seteCreatedUpdatedBy } from '@/lib/utils/set_created_updated_by'

import { type CollectionBeforeValidateHook } from 'payload'

export const setCreatedUpdatedBy: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Automatically set createdBy to the current user
  return seteCreatedUpdatedBy({
    data,
    operation,
    userId: req.user ? req.user.id : null,
  })
}
