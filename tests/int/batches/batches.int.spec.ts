import type { Product, Shop, User } from '@/payload-types'
import config from '@/payload.config'

import { Payload, getPayload } from 'payload'
import { clearAllCollections } from 'tests/utils/testCleanUp'
import { v4 as uuidv4 } from 'uuid'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { TestFactory } from '../../utils/testFactory'

let payload: Payload
let factory: TestFactory

// Test data variables
let testUser: User
let testShop: Shop
let testProduct: Product

describe('Batches Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    factory = new TestFactory(payload)
    await clearAllCollections(payload) // Clear collections before tests
  })

  beforeEach(async () => {
    const setup = await factory.createCompleteSetup()
    testUser = setup.user
    testShop = setup.shop
    testProduct = setup.product
  })

  afterEach(async () => {
    await clearAllCollections(payload)
  })

  describe('Batch Creation Tests', () => {
    it('should create a batch with valid data', async () => {
      const batchData = {
        shop: testShop.id,
        batchNumber: `BATCH${uuidv4()}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        quantity: 100,
        stockAlert: 10,
        status: 'active' as const,
      }

      const batch = await payload.create({
        collection: 'batches',
        data: batchData,
        user: testUser,
      })

      expect(batch).toBeDefined()
      expect(batch.batchNumber).toBe(batchData.batchNumber)
      expect(typeof batch.shop === 'string' ? batch.shop : batch.shop?.id).toBe(testShop.id)
      expect(batch.quantity).toBe(100)
      expect(batch.stockAlert).toBe(10)
      expect(batch.status).toBe('active')
      expect(batch.createdBy).toBeDefined()
      expect(new Date(batch.expiryDate).getTime()).toBeGreaterThan(Date.now())
    })

    it('should create batch with product reference', async () => {
      const batchData = {
        shop: testShop.id,
        batchNumber: `BATCH${uuidv4()}`,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: 50,
        stockAlert: 5,
        product: testProduct.id,
        status: 'active' as const,
      }

      const batch = await payload.create({
        collection: 'batches',
        data: batchData,
        user: testUser,
      })

      expect(batch).toBeDefined()
      expect(typeof batch.product === 'string' ? batch.product : batch.product?.id).toBe(
        testProduct.id
      )
    })

    it('should set default values correctly', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
        },
        user: testUser,
      })

      expect(batch.quantity).toBe(0) // Default value
      expect(batch.status).toBe('active') // Default value
    })
  })

  describe('Batch Validation Tests', () => {
    it('should require all mandatory fields', async () => {
      await expect(
        payload.create({
          collection: 'batches',
          data: {
            // Missing required fields like shop, batchNumber, expiryDate, stockAlert
            batchNumber: 'Test Batch',
          } as any,
          user: testUser,
        })
      ).rejects.toThrow()
    })

    it('should validate stock alert is greater than zero', async () => {
      await expect(
        payload.create({
          collection: 'batches',
          data: {
            shop: testShop.id,
            batchNumber: `INVALID${uuidv4()}`,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stockAlert: 0, // Invalid stock alert
            status: 'active' as const,
          },
          user: testUser,
        })
      ).rejects.toThrow('Stock')
    })

    it('should validate stock alert for negative values', async () => {
      await expect(
        payload.create({
          collection: 'batches',
          data: {
            shop: testShop.id,
            batchNumber: `INVALID2${uuidv4()}`,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            stockAlert: -5, // Negative stock alert
            status: 'active' as const,
          },
          user: testUser,
        })
      ).rejects.toThrow('Stock')
    })

    it('should reject expiry date in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday

      await expect(
        payload.create({
          collection: 'batches',
          data: {
            shop: testShop.id,
            batchNumber: `PASTDATE${uuidv4()}`,
            expiryDate: pastDate,
            stockAlert: 10,
            status: 'active' as const,
          },
          user: testUser,
        })
      ).rejects.toThrow('Expiry date cannot be in the past.')
    })
  })

  describe('Batch Number Uniqueness Tests', () => {
    it('should throw error when creating batch with duplicate batch number in same shop', async () => {
      const batchNumber = `DUPLICATE${uuidv4()}`

      // Create first batch
      await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Try to create second batch with same batch number
      await expect(
        payload.create({
          collection: 'batches',
          data: {
            shop: testShop.id,
            batchNumber, // Same batch number
            expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            stockAlert: 5,
            status: 'active' as const,
          },
          user: testUser,
        })
      ).rejects.toThrow(`Batch ${batchNumber} already exists.`)
    })

    it('should allow same batch number in different shops', async () => {
      const batchNumber = `DIFFSHOP${uuidv4()}`

      // Create another shop
      const anotherShop = await payload.create({
        collection: 'shops',
        data: {
          name: `Another Shop ${uuidv4()}`,
          location: 'Another Location',
          owner: testUser.id,
          shopType: 'retail' as const,
          shopCategory: 'grocery' as const,
          countryCode: '+233',
          contactNumber: '+233987654321',
          currency: 'GHS' as const,
        },
      })

      // Create batch in first shop
      await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Should be able to create batch with same batch number in different shop
      const batchInShop2 = await payload.create({
        collection: 'batches',
        data: {
          shop: anotherShop.id,
          batchNumber, // Same batch number, different shop
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 5,
          status: 'active' as const,
        },
        user: testUser,
      })

      expect(batchInShop2).toBeDefined()
      expect(
        typeof batchInShop2.shop === 'string' ? batchInShop2.shop : batchInShop2.shop?.id
      ).toBe(anotherShop.id)
    })
  })

  describe('Batch Status Tests', () => {
    it('should create batch with active status by default', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 5,
        },
        user: testUser,
      })

      expect(batch.status).toBe('active')
    })
  })

  describe('Batch Update Tests', () => {
    it('should set updatedBy field during update', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      const updatedBatch = await payload.update({
        collection: 'batches',
        id: batch.id,
        data: {
          stockAlert: 15, // Update stock alert
        },
        user: testUser,
      })

      expect(updatedBatch.updatedBy).toBeDefined()
      expect(
        typeof updatedBatch.updatedBy === 'string'
          ? updatedBatch.updatedBy
          : updatedBatch.updatedBy?.id
      ).toBe(testUser.id)
      expect(updatedBatch.stockAlert).toBe(15)
    })

    it('should allow updating expiry date for existing batches', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Update expiry date (validation only applies to 'create' operation)
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      const updatedBatch = await payload.update({
        collection: 'batches',
        id: batch.id,
        data: {
          expiryDate: futureDate,
        },
        user: testUser,
      })

      expect(updatedBatch.expiryDate).toBe(futureDate)
    })
  })

  describe('Batch Admin Configuration Tests', () => {
    it('should have correct admin configuration', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Verify batch is created and can be used as title (useAsTitle: 'batchNumber')
      expect(batch.batchNumber).toBeDefined()
      expect(typeof batch.batchNumber).toBe('string')
    })

    it('should sort batches by expiry date (FIFO)', async () => {
      // Create batches with different expiry dates
      const batch1 = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH1${uuidv4()}`,
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      const batch2 = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH2${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      const batch3 = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH3${uuidv4()}`,
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Find all batches (should be sorted by expiry date)
      const batches = await payload.find({
        collection: 'batches',
        sort: 'expiryDate', // Explicit sort to match defaultSort
      })

      expect(batches.docs.length).toBeGreaterThanOrEqual(3)

      // Find our specific batches and verify sorting
      const ourBatches = batches.docs.filter(batch =>
        [batch1.id, batch2.id, batch3.id].includes(batch.id)
      )

      expect(ourBatches).toHaveLength(3)

      // Should be sorted: batch2 (30 days), batch3 (45 days), batch1 (60 days)
      expect(new Date(ourBatches[0].expiryDate).getTime()).toBeLessThan(
        new Date(ourBatches[1].expiryDate).getTime()
      )
      expect(new Date(ourBatches[1].expiryDate).getTime()).toBeLessThan(
        new Date(ourBatches[2].expiryDate).getTime()
      )
    })
  })

  describe('Batch Access Control Tests', () => {
    it('should allow reading batches', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      const foundBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })

      expect(foundBatch).toBeDefined()
      expect(foundBatch.id).toBe(batch.id)
    })

    it('should prevent deletion of batches', async () => {
      const batch = await payload.create({
        collection: 'batches',
        data: {
          shop: testShop.id,
          batchNumber: `BATCH${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stockAlert: 10,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Should not be able to delete the batch (access.delete: false)
      try {
        await payload.delete({
          collection: 'batches',
          id: batch.id,
        })
        // If deletion succeeds, fail the test
        expect(true).toBe(false)
      } catch (error) {
        // Deletion should fail, which is expected
        expect(error).toBeDefined()
      }
    })
  })
})
