import type { CollectionBeforeChangeHook } from 'payload'

import { generateUniqueJarShortCode } from '@/utilities/shortCode'

/**
 * Gives every jar a short code for its share link (hogapay.com/j/<code>). Assigned once on
 * create, or on the first update of a jar created before short codes existed; never changed.
 */
export const assignShortCode: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (originalDoc?.shortCode) {
    data.shortCode = originalDoc.shortCode
    return data
  }
  if (!data.shortCode) {
    data.shortCode = await generateUniqueJarShortCode(req.payload)
  }
  return data
}
