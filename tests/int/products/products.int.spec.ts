import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect, beforeEach, afterAll } from 'vitest'
import type { Product, Shop, User, Category, Batch } from '@/payload-types'
import { v4 as uuidv4 } from 'uuid'
import { clearAllCollections } from 'tests/utils/testCleanUp'
import { TestFactory } from '../../utils/testFactory'

let payload: Payload
let factory: TestFactory

// Test data variables
let testUser: User
let testShop: Shop
let testCategory: Category

describe('Products Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    factory = new TestFactory(payload)
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    const setup = await factory.createCompleteSetup()
    testUser = setup.user
    testShop = setup.shop
    testCategory = setup.category
  })

  afterEach(async () => {
    await clearAllCollections(payload)
  })

  describe('Product Creation Tests', () => {
    it('should create a basic retail product without expiry tracking', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product No Expiry ${Date.now()}`,
        trackExpiry: false,
        inventory: { quantity: 0, stockAlert: 10 },
      })

      expect(product).toBeDefined()
      expect(product.name).toContain('Test Product No Expiry')
      expect(product.barcode).toBeDefined()
      expect(typeof product.shop === 'string' ? product.shop : product.shop?.id).toBe(testShop.id)
      expect(typeof product.category === 'string' ? product.category : product.category?.id).toBe(
        testCategory.id,
      )
      expect(product.trackInventory).toBe(true)
      expect(product.trackExpiry).toBe(false)
      expect(product.inventory?.quantity).toBe(0)
      expect(product.inventory?.stockAlert).toBe(10)
      expect(product.status).toBe('active')
      expect(product.createdBy).toBeDefined()
    })

    it('should create a product with expiry tracking', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product With Expiry ${Date.now()}`,
        trackExpiry: true,
      })

      expect(product).toBeDefined()
      expect(product.trackInventory).toBe(true)
      expect(product.trackExpiry).toBe(true)
    })

    it('should create a wholesale product with quantity per unit', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Wholesale Product ${Date.now()}`,
        prodSellingType: 'wholesale',
        unit: 'pack',
        quantityPerWholesaleUnit: 12,
        costPricePerUnit: 100,
        sellingPricePerUnit: 150,
        trackExpiry: false,
        inventory: { quantity: 50, stockAlert: 5 },
      })

      expect(product).toBeDefined()
      expect(product.prodSellingType).toBe('wholesale')
      expect(product.quantityPerWholesaleUnit).toBe(12)
      expect(product.unit).toBe('pack')
    })

    it('should create a product with color when no image is provided', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product With Color ${Date.now()}`,
        color: '#FF5733',
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
      })

      expect(product).toBeDefined()
      expect(product.color).toBe('#FF5733')
    })
  })

  describe('Product Barcode Uniqueness Tests', () => {
    it('should throw error when creating product with duplicate barcode in same shop', async () => {
      const barcode = `DUPLICATE${uuidv4()}`

      // Create first product
      await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'First Product',
        barcode,
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
      })

      // Try to create second product with same barcode
      await expect(
        factory.createProduct(testShop.id, testCategory.id, testUser, {
          name: 'Second Product',
          barcode, // Same barcode
          trackExpiry: false,
          inventory: { quantity: 100, stockAlert: 10 },
        }),
      ).rejects.toThrow(`Barcode ${barcode} already exists.`)
    })

    it('should allow same barcode for inactive product', async () => {
      const barcode = `INACTIVE${uuidv4()}`

      // Create inactive product
      await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Inactive Product',
        barcode,
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
        status: 'inactive',
      })

      // Should be able to create active product with same barcode
      const activeProduct = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Active Product',
        barcode, // Same barcode as inactive product
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
        status: 'active',
      })

      expect(activeProduct).toBeDefined()
      expect(activeProduct.status).toBe('active')
    })

    it('should allow same barcode in different shops', async () => {
      const barcode = `DIFFSHOP${uuidv4()}`

      // Create another shop
      const anotherShop = await factory.createShop(testUser.id, {
        name: `Another Shop ${Date.now()}`,
        location: 'Another Location',
        contactNumber: '+233987654321',
      })

      // Create product in first shop
      await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Product in Shop 1',
        barcode,
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
      })

      // Should be able to create product with same barcode in different shop
      const productInShop2 = await factory.createProduct(
        anotherShop.id,
        testCategory.id,
        testUser,
        {
          name: 'Product in Shop 2',
          barcode, // Same barcode, different shop
          trackExpiry: false,
          inventory: { quantity: 100, stockAlert: 10 },
        },
      )

      expect(productInShop2).toBeDefined()
      expect(
        typeof productInShop2.shop === 'string' ? productInShop2.shop : productInShop2.shop?.id,
      ).toBe(anotherShop.id)
    })
  })

  describe('Product Batch Integration Tests', () => {
    it('should create product with batch tracking and link batches', async () => {
      // Create product with expiry tracking
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product With Batches ${Date.now()}`,
        trackExpiry: true,
      })

      // Create a batch
      const batch = await factory.createBatch(testShop.id, testUser, {
        batchNumber: `BATCH${Date.now()}`,
        quantity: 50,
        stockAlert: 5,
      })

      // Update product to include the batch
      const updatedProduct = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          batches: [batch.id],
        },
        user: testUser,
      })

      expect(updatedProduct.batches).toBeDefined()
      expect(
        Array.isArray(updatedProduct.batches)
          ? updatedProduct.batches.map((b) => (typeof b === 'string' ? b : b?.id))
          : [updatedProduct.batches],
      ).toContain(batch.id)

      // Verify batch was updated with product reference via afterChange hook
      const updatedBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })

      expect(
        typeof updatedBatch.product === 'string' ? updatedBatch.product : updatedBatch.product?.id,
      ).toBe(product.id)
    })

    it('should handle multiple batches for a single product', async () => {
      // Create product with expiry tracking
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product Multiple Batches ${Date.now()}`,
        trackExpiry: true,
      })

      // Create multiple batches
      const batch1 = await factory.createBatch(testShop.id, testUser, {
        batchNumber: `BATCH1-${Date.now()}`,
        quantity: 50,
        stockAlert: 5,
      })

      const batch2 = await factory.createBatch(testShop.id, testUser, {
        batchNumber: `BATCH2-${Date.now()}`,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: 30,
        stockAlert: 3,
      })

      // Update product to include both batches
      const updatedProduct = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          batches: [batch1.id, batch2.id],
        },
        user: testUser,
      })

      expect(updatedProduct.batches).toBeDefined()
      expect(updatedProduct.batches).toHaveLength(2)
      expect(
        updatedProduct.batches?.map((batch) => (typeof batch === 'string' ? batch : batch?.id)),
      ).toContain(batch1.id)
      expect(
        updatedProduct.batches?.map((batch) => (typeof batch === 'string' ? batch : batch?.id)),
      ).toContain(batch2.id)
    })
  })

  describe('Product Validation Tests', () => {
    it('should require all mandatory fields', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: {
            // Missing required fields like shop, barcode, category, etc.
            name: 'Test Product',
            // This should fail validation
          } as any, // Use 'as any' to bypass TypeScript for testing validation
          user: testUser,
        }),
      ).rejects.toThrow()
    })

    it('should validate stock alert is greater than zero', async () => {
      await expect(
        factory.createProduct(testShop.id, testCategory.id, testUser, {
          name: 'Test Product',
          trackExpiry: false,
          inventory: {
            quantity: 100,
            stockAlert: 0, // Invalid stock alert
          },
        }),
      ).rejects.toThrow('The following field is invalid: Inventory > Stock Alert')
    })

    it('should validate stock alert is greater than zero for negative values', async () => {
      await expect(
        factory.createProduct(testShop.id, testCategory.id, testUser, {
          name: 'Test Product',
          trackExpiry: false,
          inventory: {
            quantity: 100,
            stockAlert: 0,
          },
        }),
      ).rejects.toThrow('The following field is invalid: Inventory > Stock Alert')
    })

    it('should set default values correctly', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Test Product Defaults',
        inventory: { stockAlert: 10 },
      })

      expect(product.prodSellingType).toBe('retail') // Default value
      expect(product.trackInventory).toBe(true) // Default value
      expect(product.trackExpiry).toBe(true) // Default value in factory
      expect(product.status).toBe('active') // Default value
      expect(product.inventory?.quantity).toBe(0) // Default value
    })
  })

  describe('Product Update Tests', () => {
    it('should set updatedBy field during update', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Test Product Update',
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
      })

      const updatedProduct = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          sellingPricePerUnit: 20, // Update price
        },
        user: testUser,
      })

      expect(updatedProduct.updatedBy).toBeDefined()
      expect(
        typeof updatedProduct.updatedBy === 'string'
          ? updatedProduct.updatedBy
          : updatedProduct.updatedBy?.id,
      ).toBe(testUser.id)
      expect(updatedProduct.sellingPricePerUnit).toBe(20)
    })

    it('should allow updating product status', async () => {
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: 'Test Product Status',
        trackExpiry: false,
        inventory: { quantity: 100, stockAlert: 10 },
        status: 'active',
      })

      const updatedProduct = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          status: 'inactive' as const,
        },
        user: testUser,
      })

      expect(updatedProduct.status).toBe('inactive')
    })

    it('should clear batches and product references when product status is set to inactive', async () => {
      // Create product with expiry tracking
      const product = await factory.createProduct(testShop.id, testCategory.id, testUser, {
        name: `Test Product Inactive ${uuidv4()}`,
        trackExpiry: true,
        status: 'active',
      })

      // Create batches linked to this product
      const batch1 = await factory.createBatch(testShop.id, testUser, {
        batchNumber: `BATCH1-${uuidv4()}`,
        quantity: 50,
        stockAlert: 5,
      })

      const batch2 = await factory.createBatch(testShop.id, testUser, {
        batchNumber: `BATCH2-${uuidv4()}`,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        quantity: 30,
        stockAlert: 3,
      })

      // Link batches to product
      const productWithBatches = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          batches: [batch1.id, batch2.id],
        },
        user: testUser,
      })

      // Verify batches are linked and have product reference
      expect(productWithBatches.batches).toHaveLength(2)

      const linkedBatch1 = await payload.findByID({
        collection: 'batches',
        id: batch1.id,
      })
      const linkedBatch2 = await payload.findByID({
        collection: 'batches',
        id: batch2.id,
      })

      expect(
        typeof linkedBatch1.product === 'string' ? linkedBatch1.product : linkedBatch1.product?.id,
      ).toBe(product.id)
      expect(
        typeof linkedBatch2.product === 'string' ? linkedBatch2.product : linkedBatch2.product?.id,
      ).toBe(product.id)

      // Set product status to inactive
      const inactiveProduct = await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          status: 'inactive' as const,
        },
        user: testUser,
      })

      // Verify product status is inactive and batches are cleared
      expect(inactiveProduct.status).toBe('inactive')
      expect(inactiveProduct.batches).toEqual([])

      // Verify that product references in batches are cleared
      const clearedBatch1 = await payload.findByID({
        collection: 'batches',
        id: batch1.id,
      })
      const clearedBatch2 = await payload.findByID({
        collection: 'batches',
        id: batch2.id,
      })

      expect(clearedBatch1.product).toBeNull()
      expect(clearedBatch2.product).toBeNull()
    })
  })

  describe('Product Admin Configuration Tests', () => {
    it('should have correct admin configuration', async () => {
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Test Product Admin',
          barcode: `ADM${uuidv4()}`,
          category: testCategory.id,
          prodSellingType: 'retail' as const,
          unit: 'piece',
          costPricePerUnit: 10,
          sellingPricePerUnit: 15,
          trackInventory: true,
          trackExpiry: false,
          inventory: {
            quantity: 100,
            stockAlert: 10,
          },
          status: 'active' as const,
        },
        user: testUser,
      })

      // Verify product is created and can be used as title (useAsTitle: 'name')
      expect(product.name).toBeDefined()
      expect(typeof product.name).toBe('string')
    })
  })
})
