import { APIError, type FieldHook } from 'payload'

export const validateUniqueBarcode: FieldHook = async ({ data, req }) => {
  // Ensure barcode is unique across products
  const existingProduct = await req.payload.find({
    collection: 'products',
    where: {
      barcode: {
        equals: data?.barcode,
      },
      shop: {
        equals: (data as any)?.shop, // Ensure the barcode is unique per shop
      },
      status: {
        equals: 'active', // Only check active products
      },
    },
  })

  if (existingProduct?.docs.length) {
    throw new APIError(`Barcode ${data?.barcode} already exists.`, 400)
  }
}
