import { APIError, type FieldHook } from 'payload'

export const validateUniqueBatchNumber: FieldHook = async ({ data, req }) => {
  // Ensure batch is unique across batches
  const existingBatch = await req.payload.find({
    collection: 'batches',
    where: {
      batchNumber: {
        equals: data?.batchNumber,
      },
      shop: {
        equals: (data as any)?.shop, // Ensure the batchNumber is unique per shop
      },
      status: {
        equals: 'active', // Only check active batches
      },
    },
  })

  if (existingBatch?.docs.length) {
    throw new APIError(`Batch ${data?.batchNumber} already exists.`, 400)
  }
}
