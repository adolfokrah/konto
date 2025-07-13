import { Endpoint } from 'payload'
import { type MoveStockData, moveStockSchema } from './schema'

export const moveStock: Endpoint = {
  path: '/move-stock',
  method: 'put',
  handler: async (req) => {
    try {
      if (!req.user) {
        return Response.json({ message: 'Unauthorized', status: 401 })
      }
      // Parse the request body
      const rawData = req.json ? await req.json() : {}

      // Validate the data with Zod
      const validationResult = moveStockSchema.safeParse(rawData)
      if (!validationResult.success) {
        return Response.json(
          {
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.issues,
          },
          { status: 400 },
        )
      }

      const data: MoveStockData = validationResult.data

      const errors: string[] = []

      // TODO: Implement your move stock logic here
      for (const stockItem of data) {
        const { fromShopId, toShopId, batchId, productId, quantity } = stockItem

        if (fromShopId == toShopId) {
          errors.push(`Cannot move stock between the same shop: ${fromShopId}`)
          continue
        }

        const fromShop = await req.payload.find({
          collection: 'shops',
          where: {
            id: {
              equals: fromShopId,
            },
          },
        })

        if (!fromShop?.docs.length) {
          errors.push(`From Shop with ID ${fromShopId} not found`)
          continue
        }

        if (typeof fromShop?.docs[0].owner != 'object') {
          errors.push(`From Shop with ID ${fromShopId} does not have a valid owner`)
          continue
        }

        const toShop = await req.payload.find({
          collection: 'shops',
          where: {
            id: {
              equals: toShopId,
            },
            owner: {
              equals: fromShop?.docs[0].owner?.id,
            },
          },
          limit: 1,
        })

        if (!toShop?.docs.length) {
          errors.push(`To Shop with ID ${toShopId} not found`)
          continue
        }

        const foundProduct = await req.payload.findByID({
          collection: 'products',
          id: productId,
        })

        // check if toShop has the same product
        const toShopProduct = await req.payload.find({
          collection: 'products',
          where: {
            barcode: {
              equals: foundProduct?.barcode,
            },
            shop: {
              equals: toShopId,
            },
          },
        })

        if (!toShopProduct.docs.length) {
          errors.push(
            `Product with barcode ${foundProduct?.barcode} not found in the products of shop ${toShop?.docs[0].name}`,
          )
          continue
        }

        if (!foundProduct?.trackExpiry) {
          if (foundProduct?.inventory?.quantity && foundProduct?.inventory?.quantity < quantity) {
            errors.push(
              `Insufficient stock for product ${foundProduct?.name} in shop ${fromShop?.docs[0].name}. Available: ${foundProduct?.inventory?.quantity}, Requested: ${quantity}`,
            )
            continue
          }

          // // Deduct from fromShop
          await req.payload.create({
            collection: 'stock',
            data: {
              shop: fromShopId,
              toShop: toShopId,
              product: foundProduct.id,
              quantity: -quantity,
            },
            req,
          })

          // Add to toShop
          await req.payload.create({
            collection: 'stock',
            data: {
              shop: toShopId,
              fromShop: fromShopId,
              product: toShopProduct.docs[0].id,
              quantity,
            },
            req,
          })
        } else if (foundProduct?.trackExpiry && batchId) {
          // Check if batch exists in fromShop

          const foundBatch = foundProduct.batches?.find(
            (batch) => typeof batch === 'object' && batch.id === batchId,
          )

          if (!foundBatch) {
            errors.push(
              `Batch with ID ${batchId} not found in product ${foundProduct.name} batches of shop ${fromShop?.docs[0].name}`,
            )
            continue
          }

          if (typeof foundBatch == 'object') {
            const foundBatchInToShopProducts = toShopProduct.docs[0].batches?.find(
              (batch) => typeof batch === 'object' && batch.batchNumber === foundBatch.batchNumber,
            )

            if (!foundBatchInToShopProducts) {
              errors.push(
                `Batch with batch number ${foundBatch.batchNumber} not found in product ${toShopProduct.docs[0].name} batches in shop ${toShop?.docs[0].name}`,
              )
              continue
            }

            if (typeof foundBatchInToShopProducts != 'object') {
              errors.push(
                `Batch with batch number ${foundBatch.batchNumber} in product ${toShopProduct.docs[0].name} in shop ${toShop?.docs[0].name} is not a valid object`,
              )
              continue
            }

            // // Deduct from fromShop
            await req.payload.create({
              collection: 'stock',
              data: {
                shop: fromShopId,
                toShop: toShopId,
                product: foundProduct.id,
                quantity: -quantity,
                batch: String(batchId),
              },
              req,
            })

            // Add to toShop
            await req.payload.create({
              collection: 'stock',
              data: {
                shop: toShopId,
                fromShop: fromShopId,
                product: toShopProduct.docs[0].id,
                quantity,
                batch: String(foundBatchInToShopProducts.id),
              },
              req,
            })
          }
        }
      }

      if (errors.length > 0) {
        return Response.json(
          {
            success: false,
            message: 'An error occurred while moving stock',
            errors,
          },
          { status: 404 },
        )
      }

      return Response.json({
        success: true,
        message: 'Stock move request validated successfully',
        data,
      })
    } catch (error) {
      return Response.json(
        {
          success: false,
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      )
    }
  },
}
