import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Writes collectorSnapshot.name and collectorSnapshot.email once when a
 * transaction is first created (or when collector is first assigned).
 * The snapshot is never overwritten on subsequent updates.
 */
export const snapshotCollector: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Skip if snapshot is already set (write-once)
  if (originalDoc?.collectorSnapshot?.name) return data

  // Resolve collector ID from incoming data or existing doc
  const collectorRaw = data?.collector ?? originalDoc?.collector
  if (!collectorRaw) return data

  const collectorId = typeof collectorRaw === 'object' ? collectorRaw?.id : collectorRaw
  if (!collectorId) return data

  try {
    const user = await req.payload.findByID({
      collection: 'users',
      id: collectorId,
      overrideAccess: true,
      select: { firstName: true, lastName: true, email: true },
    })

    if (!user) return data

    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || ''

    return {
      ...data,
      collectorSnapshot: {
        name,
        email: user.email || '',
      },
    }
  } catch {
    return data
  }
}
