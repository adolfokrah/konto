import { CollectionSlug, Payload } from 'payload'

export async function clearAllCollections(payload: Payload) {
  try {
    // Get all collection names from payload config
    const collections = ['users', 'jars', 'contributions', 'media']

    for (const collection of collections) {
      try {
        await payload.delete({
          collection: collection as any,
          where: {},
        })
      } catch (error) {
        console.warn('Cleanup failed:', error)
      }
    }
  } catch (error) {
    console.error('❌ Failed to clear collections:', error)
    throw error
  }
}
