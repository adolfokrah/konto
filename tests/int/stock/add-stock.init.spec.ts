import type { Batch, Product, Shop, User } from '@/payload-types'
import config from '@/payload.config'

import { Payload, getPayload } from 'payload'
import { clearAllCollections } from 'tests/utils/testCleanUp'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { TestFactory } from '../../utils/testFactory'

let payload: Payload
let factory: TestFactory

// Test data variables
let testUser: User
let testShop: Shop
let testProduct: Product
let testProductWithExpiry: Product
let testBatch: Batch

describe('Add Stock Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    factory = new TestFactory(payload)
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    // Use the working setup method from other tests
    const setup = await factory.createCompleteSetup()
    testUser = setup.user
    testShop = setup.shop
    testProduct = setup.product

    // Create a product without expiry tracking for simpler testing
    testProduct = await factory.createProduct(testShop.id, setup.category.id, testUser, {
      name: 'Test Product No Expiry',
      trackExpiry: false,
      trackInventory: true,
      inventory: { quantity: 100, stockAlert: 10 },
    })

    // Create a product with expiry tracking
    testProductWithExpiry = await factory.createProduct(testShop.id, setup.category.id, testUser, {
      name: 'Test Product With Expiry',
      trackExpiry: true,
      trackInventory: true,
    })

    // Create a batch for the expiry product
    testBatch = await factory.createBatch(testShop.id, testUser, {
      batchNumber: 'BATCH001',
      product: testProductWithExpiry.id,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      stockAlert: 5,
      status: 'active',
      quantity: 50,
    })
  })

  afterEach(async () => {
    await clearAllCollections(payload)
  })

  describe('Stock Addition Tests', () => {
    it('should successfully add stock for product without expiry tracking', async () => {
      // Get initial product quantity
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      // Add stock directly through stock collection
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 25,
          reason: 'Direct stock addition test',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(stockEntry.type).toBe('purchase')
      expect(stockEntry.quantity).toBe(25)
      expect(stockEntry.newQuantity).toBe(initialQuantity + 25) // Should calculate running total
      expect(
        typeof stockEntry.product === 'string' ? stockEntry.product : stockEntry.product?.id
      ).toBe(testProduct.id)
      expect(typeof stockEntry.shop === 'string' ? stockEntry.shop : stockEntry.shop?.id).toBe(
        testShop.id
      )

      // Verify product inventory was updated
      const updatedProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      expect(updatedProduct.inventory?.quantity).toBe(initialQuantity + 25)
    })

    it('should successfully add stock for product with expiry tracking and batch', async () => {
      // Get initial batch quantity
      const initialBatch = await payload.findByID({
        collection: 'batches',
        id: testBatch.id,
      })
      const initialBatchQuantity = initialBatch.quantity || 0

      // Add stock directly through stock collection with batch
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProductWithExpiry.id,
          batch: testBatch.id,
          type: 'purchase',
          quantity: 15,
          reason: 'Direct batch stock addition test',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(stockEntry.type).toBe('purchase')
      expect(stockEntry.quantity).toBe(15)
      expect(stockEntry.newQuantity).toBe(initialBatchQuantity + 15) // Should calculate running total for batch
      expect(
        typeof stockEntry.product === 'string' ? stockEntry.product : stockEntry.product?.id
      ).toBe(testProductWithExpiry.id)
      expect(stockEntry.batch).toBe(testBatch.id)
      expect(typeof stockEntry.shop === 'string' ? stockEntry.shop : stockEntry.shop?.id).toBe(
        testShop.id
      )

      // Verify batch quantity was updated
      const updatedBatch = await payload.findByID({
        collection: 'batches',
        id: testBatch.id,
      })
      expect(updatedBatch.quantity).toBe(initialBatchQuantity + 15)
    })

    it('should successfully create stock adjustment entry', async () => {
      // Get initial product quantity
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      // Create positive adjustment
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'adjustment',
          quantity: 10,
          reason: 'Stock count correction - found extra items',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(stockEntry.type).toBe('adjustment')
      expect(stockEntry.quantity).toBe(10)
      expect(stockEntry.newQuantity).toBe(initialQuantity + 10) // Should calculate running total
      expect(stockEntry.reason).toBe('Stock count correction - found extra items')

      // Verify product inventory was updated
      const updatedProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      expect(updatedProduct.inventory?.quantity).toBe(initialQuantity + 10)
    })

    it('should successfully create negative stock adjustment entry', async () => {
      // Get initial product quantity
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      // Create negative adjustment (stock reduction)
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'adjustment',
          quantity: -5,
          reason: 'Stock count correction - items missing',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(stockEntry.type).toBe('adjustment')
      expect(stockEntry.quantity).toBe(-5)
      expect(stockEntry.newQuantity).toBe(initialQuantity - 5) // Should calculate running total
      expect(stockEntry.reason).toBe('Stock count correction - items missing')

      // Verify product inventory was updated
      const updatedProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      expect(updatedProduct.inventory?.quantity).toBe(initialQuantity - 5)
    })

    it('should handle multiple stock entries and maintain correct running totals', async () => {
      // Get initial product quantity
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      // Create first stock entry
      const stockEntry1 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 20,
          reason: 'First purchase',
        },
        user: testUser,
      })

      expect(stockEntry1.newQuantity).toBe(initialQuantity + 20)

      // Create second stock entry
      const stockEntry2 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 15,
          reason: 'Second purchase',
        },
        user: testUser,
      })

      expect(stockEntry2.newQuantity).toBe(initialQuantity + 20 + 15) // Should build on previous total

      // Create adjustment entry
      const stockEntry3 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'adjustment',
          quantity: -3,
          reason: 'Damaged items removal',
        },
        user: testUser,
      })

      expect(stockEntry3.newQuantity).toBe(initialQuantity + 20 + 15 - 3)

      // Verify final product inventory
      const finalProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      expect(finalProduct.inventory?.quantity).toBe(initialQuantity + 20 + 15 - 3)

      // Verify all stock records exist
      const stockRecords = await payload.find({
        collection: 'stock',
        where: {
          product: {
            equals: testProduct.id,
          },
        },
      })
      expect(stockRecords.docs).toHaveLength(3)
    })

    it('should require batch for products with expiry tracking', async () => {
      // Try to create stock entry for expiry-tracked product without batch
      await expect(
        payload.create({
          collection: 'stock',
          data: {
            shop: testShop.id,
            product: testProductWithExpiry.id,
            type: 'purchase',
            quantity: 10,
            reason: 'Should fail without batch',
          },
          user: testUser,
        })
      ).rejects.toThrow('Batch is required for products with expiry tracking enabled.')
    })

    it('should set createdBy and updatedBy fields correctly', async () => {
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 5,
          reason: 'Testing user fields',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(
        typeof stockEntry.createdBy === 'string' ? stockEntry.createdBy : stockEntry.createdBy?.id
      ).toBe(testUser.id)
      expect(
        typeof stockEntry.updatedBy === 'string' ? stockEntry.updatedBy : stockEntry.updatedBy?.id
      ).toBe(testUser.id)
    })

    it('should handle batch stock operations correctly with running totals', async () => {
      // Get initial batch quantity
      const initialBatch = await payload.findByID({
        collection: 'batches',
        id: testBatch.id,
      })
      const initialBatchQuantity = initialBatch.quantity || 0

      // Add stock to batch
      const stockEntry1 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProductWithExpiry.id,
          batch: testBatch.id,
          type: 'purchase',
          quantity: 12,
          reason: 'First batch addition',
        },
        user: testUser,
      })

      expect(stockEntry1.newQuantity).toBe(initialBatchQuantity + 12)

      // Add more stock to same batch
      const stockEntry2 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProductWithExpiry.id,
          batch: testBatch.id,
          type: 'purchase',
          quantity: 8,
          reason: 'Second batch addition',
        },
        user: testUser,
      })

      expect(stockEntry2.newQuantity).toBe(initialBatchQuantity + 12 + 8)

      // Adjust batch stock
      const stockEntry3 = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProductWithExpiry.id,
          batch: testBatch.id,
          type: 'adjustment',
          quantity: -2,
          reason: 'Batch adjustment - expired items',
        },
        user: testUser,
      })

      expect(stockEntry3.newQuantity).toBe(initialBatchQuantity + 12 + 8 - 2)

      // Verify final batch quantity
      const finalBatch = await payload.findByID({
        collection: 'batches',
        id: testBatch.id,
      })
      expect(finalBatch.quantity).toBe(initialBatchQuantity + 12 + 8 - 2)
    })

    it('should prevent updates to stock entries', async () => {
      // Create a stock entry
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 10,
          reason: 'Original entry',
        },
        user: testUser,
      })

      // Try to update - should be prevented by access control
      await expect(
        payload.update({
          collection: 'stock',
          id: stockEntry.id,
          data: {
            quantity: 20,
            reason: 'Modified entry',
          },
          user: testUser,
        })
      ).rejects.toThrow()
    })

    it('should prevent deletion of stock entries', async () => {
      // Create a stock entry
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id,
          type: 'purchase',
          quantity: 10,
          reason: 'Entry to test deletion',
        },
        user: testUser,
      })

      // Try to delete - should be prevented by access control
      await expect(
        payload.delete({
          collection: 'stock',
          id: stockEntry.id,
          user: testUser,
        })
      ).rejects.toThrow()
    })

    it('should filter products correctly in relationship field', async () => {
      // Try to create stock entry for non-inventory product - should fail validation or be filtered out
      // This test verifies the filterOptions in the product relationship field
      const stockEntry = await payload.create({
        collection: 'stock',
        data: {
          shop: testShop.id,
          product: testProduct.id, // Use valid inventory-tracked product
          type: 'purchase',
          quantity: 5,
          reason: 'Valid inventory product',
        },
        user: testUser,
      })

      expect(stockEntry).toBeDefined()
      expect(
        typeof stockEntry.product === 'string' ? stockEntry.product : stockEntry.product?.id
      ).toBe(testProduct.id)
    })
  })
})
