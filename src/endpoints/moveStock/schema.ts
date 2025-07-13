import { z } from 'zod'

// Define the validation schema
export const moveStockSchema = z.array(
  z.object({
    fromShopId: z.number().positive('From shop ID must be a positive number'),
    toShopId: z.number().positive('To shop ID must be a positive number'),
    batchId: z.number().optional(),
    productId: z.number().positive('Product ID must be a positive number'),
    quantity: z.number().positive('Quantity must be a positive number'),
  }),
)

// Type inference from the schema
export type MoveStockData = z.infer<typeof moveStockSchema>
