import { moveStock } from '@/endpoints/moveStock'
import config from '@/payload.config'

import { Payload, getPayload } from 'payload'
import { clearAllCollections } from 'tests/utils/testCleanUp'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { TestFactory } from '../../utils/testFactory'

let payload: Payload
let factory: TestFactory

// Test data variables
let testUser: any
let fromShop: any
let toShop: any
let testCategory: any
let productWithoutExpiry: any
let productWithExpiry: any
let testBatch: any

describe('Move Stock API Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    factory = new TestFactory(payload)
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    const setup = await factory.createCompleteSetup()
    testUser = setup.user
    fromShop = setup.shop
    testCategory = setup.category
    productWithoutExpiry = await factory.createProduct(fromShop.id, testCategory.id, testUser, {
      trackExpiry: false,
      inventory: { quantity: 100, stockAlert: 10 },
    })
    productWithExpiry = await factory.createProduct(fromShop.id, testCategory.id, testUser, {
      trackExpiry: true,
      inventory: { quantity: 50, stockAlert: 5 },
      batches: [
        await factory.createBatch(fromShop.id, testUser, {
          quantity: 50,
          stockAlert: 5,
        }),
      ],
    })

    // Create toShop
    toShop = await factory.createShop(testUser.id, {
      name: `To Shop ${Date.now()}`,
      location: 'To Location',
    })

    // Create corresponding products in toShop with same barcodes
    await factory.createProduct(toShop.id, testCategory.id, testUser, {
      barcode: productWithoutExpiry.barcode,
      trackExpiry: false,
      inventory: { quantity: 50, stockAlert: 10 },
    })

    await factory.createProduct(toShop.id, testCategory.id, testUser, {
      barcode: productWithExpiry.barcode,
      trackExpiry: true,
      inventory: { quantity: 20, stockAlert: 5 },
      batches: [
        await factory.createBatch(toShop.id, testUser, {
          batchNumber: productWithExpiry.batches[0].batchNumber,
          quantity: 20,
          stockAlert: 5,
        }),
      ],
    })

    testBatch = productWithExpiry.batches[0]
    await payload.create({
      collection: 'suppliers',
      data: {
        name: `Test Supplier ${Date.now()}`,
        contactInfo: {
          email: 'test@supplier.com',
          phone: '+233123456789',
        },
      },
    })
  })

  afterEach(async () => {
    await clearAllCollections(payload)
  })

  describe('Input Validation', () => {
    it('should return validation error for invalid input', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: 4, // Should be number
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 5,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.message).toBe('Validation failed')
      expect(result.errors).toBeDefined()
    })

    it('should return unauthorized error when user is not provided', async () => {
      const mockReq = {
        json: async () => [],
        user: null,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.status).toBe(401)
      expect(result.message).toBe('Unauthorized')
    })
  })

  describe('Business Logic Validation', () => {
    it('should return error when trying to move stock to the same shop', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: fromShop.id, // Same shop
            productId: productWithoutExpiry.id,
            quantity: 5,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.errors).toContain(`Cannot move stock between the same shop: ${fromShop.id}`)
    })

    it('should return error when fromShop does not exist', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: '99999', // Non-existent shop
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 5,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.errors).toContain('From Shop with ID 99999 not found')
    })

    it('should return error when insufficient stock', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 200, // More than available (100)
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.errors.some((error: string) => error.includes('Insufficient stock'))).toBe(true)
    })
  })

  describe('Successful Stock Movement', () => {
    it('should successfully move stock for products without expiry tracking', async () => {
      const moveQuantity = 10

      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: moveQuantity,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Stock move request validated successfully')

      // Verify stock entries were created
      const stockEntries = await payload.find({
        collection: 'stock',
        where: {
          or: [
            {
              and: [
                { shop: { equals: fromShop.id } },
                { product: { equals: productWithoutExpiry.id } },
              ],
            },
            {
              and: [{ shop: { equals: toShop.id } }, { product: { exists: true } }],
            },
          ],
        },
      })

      expect(stockEntries.docs.length).toBeGreaterThanOrEqual(2)

      // Verify inventory quantities were updated correctly
      const updatedFromProduct = await payload.findByID({
        collection: 'products',
        id: productWithoutExpiry.id,
      })

      // Find the corresponding product in toShop by barcode
      const toShopProducts = await payload.find({
        collection: 'products',
        where: {
          and: [
            { shop: { equals: toShop.id } },
            { barcode: { equals: productWithoutExpiry.barcode } },
          ],
        },
      })

      expect(toShopProducts.docs.length).toBe(1)
      const updatedToProduct = toShopProducts.docs[0]

      // Verify from shop product inventory decreased
      expect(updatedFromProduct.inventory).toBeDefined()
      expect(updatedFromProduct.inventory!.quantity).toBe(100 - moveQuantity) // Original 100 - 10 moved

      // Verify to shop product inventory increased
      expect(updatedToProduct.inventory).toBeDefined()
      expect(updatedToProduct.inventory!.quantity).toBe(50 + moveQuantity) // Original 50 + 10 moved // At least deduction and addition entries
    })

    it('should successfully move stock for products with expiry tracking', async () => {
      const moveQuantity = 5

      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithExpiry.id,
            quantity: moveQuantity,
            batchId: testBatch.id,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.message).toBe('Stock move request validated successfully')

      // Verify stock entries were created
      const stockEntries = await payload.find({
        collection: 'stock',
        where: {
          product: { equals: productWithExpiry.id },
        },
      })

      // Should have at least the deduction entry
      expect(stockEntries.docs.length).toBeGreaterThanOrEqual(1)

      // Check that we have a deduction entry with negative quantity
      const deductionEntry = stockEntries.docs.find(entry => entry.quantity < 0)
      expect(deductionEntry).toBeDefined()
      expect(deductionEntry!.quantity).toBe(-moveQuantity)
      expect(deductionEntry!.batch).toBe(String(testBatch.id))

      // Verify batch quantity was decreased
      const updatedFromBatch = await payload.findByID({
        collection: 'batches',
        id: testBatch.id,
      })

      expect(updatedFromBatch.quantity).toBe(50 - moveQuantity) // Original 50 - 5 moved

      // Find the corresponding batch in toShop by batch number
      const toShopBatches = await payload.find({
        collection: 'batches',
        where: {
          and: [
            { shop: { equals: toShop.id } },
            { batchNumber: { equals: testBatch.batchNumber } },
          ],
        },
      })

      expect(toShopBatches.docs.length).toBe(1)
      const updatedToBatch = toShopBatches.docs[0]
      expect(updatedToBatch.quantity).toBe(20 + moveQuantity) // Original 20 + 5 moved
    })
  })

  describe('Multiple Stock Movements', () => {
    it('should handle multiple valid stock movements in one request', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 5,
          },
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithExpiry.id,
            quantity: 3,
            batchId: testBatch.id,
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.length).toBe(2)
    })

    it('should return errors for invalid movements while processing valid ones', async () => {
      const mockReq = {
        json: async () => [
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 200, // Invalid - too much
          },
          {
            fromShopId: fromShop.id,
            toShopId: toShop.id,
            productId: productWithoutExpiry.id,
            quantity: 5, // Valid
          },
        ],
        user: testUser,
        payload,
      }

      const response = await moveStock.handler(mockReq as any)
      const result = await response.json()

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
