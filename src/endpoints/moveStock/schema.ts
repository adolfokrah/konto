import { z } from 'zod'

// Define the validation schema
export const moveStockSchema = z.array(
  z.object({
    fromShopId: z.string('From shop ID must be a provided'),
    toShopId: z.string('To shop ID must be a provided'),
    batchId: z.string().optional(),
    productId: z.string('Product ID must be a provided'),
    quantity: z.number().positive('Quantity must be a provided'),
  }),
)

// Type inference from the schema
export type MoveStockData = z.infer<typeof moveStockSchema>
