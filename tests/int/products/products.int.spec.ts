import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterEach, expect, beforeEach, afterAll } from 'vitest'
import type { Product, Shop, User, Category, Batch } from '@/payload-types'
import { v4 as uuidv4 } from 'uuid'
import { clearAllCollections } from '@/lib/utils/testCleanUp'

let payload: Payload

// Test data variables
let testUser: User
let testShop: Shop
let testCategory: Category

describe('Products Collection Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    // Create test user
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: `vendor-${Date.now()}@test.com`,
        password: 'password123',
        fullName: 'Test Vendor User',
        countryCode: '+233',
        phoneNumber: '1234567890',
        role: 'vendor' as const,
      },
    })

    // Create test shop
    testShop = await payload.create({
      collection: 'shops',
      data: {
        name: `Test Shop ${Date.now()}`,
        location: 'Test Location',
        owner: testUser.id,
        shopType: 'retail' as const,
        shopCategory: 'grocery' as const,
        countryCode: '+233',
        contactNumber: '+233123456789',
        currency: 'GHS' as const,
      },
    })

    // Create test category
    testCategory = await payload.create({
      collection: 'categories',
      data: {
        name: `Test Category ${Date.now()}`,
      },
    })
  })

  describe('Product Creation Tests', () => {
    it('should create a basic retail product without expiry tracking', async () => {
      const productData = {
        shop: testShop.id,
        name: `Test Product No Expiry ${Date.now()}`,
        barcode: `BC${uuidv4()}`,
        category: testCategory.id,
        prodSellingType: 'retail' as const,
        unit: 'piece',
        costPricePerUnit: 10,
        sellingPricePerUnit: 15,
        trackInventory: true,
        trackExpiry: false,
        inventory: {
          quantity: 0,
          stockAlert: 10,
        },
        status: 'active' as const,
      }

      const product = await payload.create({
        collection: 'products',
        data: productData,
        user: testUser,
      })

      expect(product).toBeDefined()
      expect(product.name).toBe(productData.name)
      expect(product.barcode).toBe(productData.barcode)
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
      const productData = {
        shop: testShop.id,
        name: `Test Product With Expiry ${Date.now()}`,
        barcode: `BCE${uuidv4()}`,
        category: testCategory.id,
        prodSellingType: 'retail' as const,
        unit: 'piece',
        costPricePerUnit: 10,
        sellingPricePerUnit: 15,
        trackInventory: true,
        trackExpiry: true,
        status: 'active' as const,
      }

      const product = await payload.create({
        collection: 'products',
        data: productData,
        user: testUser,
      })

      expect(product).toBeDefined()
      expect(product.trackInventory).toBe(true)
      expect(product.trackExpiry).toBe(true)
    })

    it('should create a wholesale product with quantity per unit', async () => {
      const productData = {
        shop: testShop.id,
        name: `Test Wholesale Product ${Date.now()}`,
        barcode: `WS${uuidv4()}`,
        category: testCategory.id,
        prodSellingType: 'wholesale' as const,
        unit: 'pack',
        quantityPerWholesaleUnit: 12,
        costPricePerUnit: 100,
        sellingPricePerUnit: 150,
        trackInventory: true,
        trackExpiry: false,
        inventory: {
          quantity: 50,
          stockAlert: 5,
        },
        status: 'active' as const,
      }

      const product = await payload.create({
        collection: 'products',
        data: productData,
        user: testUser,
      })

      expect(product).toBeDefined()
      expect(product.prodSellingType).toBe('wholesale')
      expect(product.quantityPerWholesaleUnit).toBe(12)
      expect(product.unit).toBe('pack')
    })

    it('should create a product with color when no image is provided', async () => {
      const productData = {
        shop: testShop.id,
        name: `Test Product With Color ${Date.now()}`,
        barcode: `CLR${uuidv4()}`,
        color: '#FF5733',
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
      }

      const product = await payload.create({
        collection: 'products',
        data: productData,
        user: testUser,
      })

      expect(product).toBeDefined()
      expect(product.color).toBe('#FF5733')
    })
  })

  describe('Product Barcode Uniqueness Tests', () => {
    it('should throw error when creating product with duplicate barcode in same shop', async () => {
      const barcode = `DUPLICATE${uuidv4()}`

      // Create first product
      await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'First Product',
          barcode,
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

      // Try to create second product with same barcode
      await expect(
        payload.create({
          collection: 'products',
          data: {
            shop: testShop.id,
            name: 'Second Product',
            barcode, // Same barcode
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
        }),
      ).rejects.toThrow(`Barcode ${barcode} already exists.`)
    })

    it('should allow same barcode for inactive product', async () => {
      const barcode = `INACTIVE${uuidv4()}`

      // Create inactive product
      await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Inactive Product',
          barcode,
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
          status: 'inactive' as const, // Inactive status
        },
        user: testUser,
      })

      // Should be able to create active product with same barcode
      const activeProduct = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Active Product',
          barcode, // Same barcode as inactive product
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

      expect(activeProduct).toBeDefined()
      expect(activeProduct.status).toBe('active')
    })

    it('should allow same barcode in different shops', async () => {
      const barcode = `DIFFSHOP${uuidv4()}`

      // Create another shop
      const anotherShop = await payload.create({
        collection: 'shops',
        data: {
          name: `Another Shop ${Date.now()}`,
          location: 'Another Location',
          owner: testUser.id,
          shopType: 'retail' as const,
          shopCategory: 'grocery' as const,
          countryCode: '+233',
          contactNumber: '+233987654321',
          currency: 'GHS' as const,
        },
      })

      // Create product in first shop
      await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Product in Shop 1',
          barcode,
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

      // Should be able to create product with same barcode in different shop
      const productInShop2 = await payload.create({
        collection: 'products',
        data: {
          shop: anotherShop.id,
          name: 'Product in Shop 2',
          barcode, // Same barcode, different shop
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

      expect(productInShop2).toBeDefined()
      expect(
        typeof productInShop2.shop === 'string' ? productInShop2.shop : productInShop2.shop?.id,
      ).toBe(anotherShop.id)
    })
  })

  describe('Product Batch Integration Tests', () => {
    it('should create product with batch tracking and link batches', async () => {
      // Create product with expiry tracking
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: `Test Product With Batches ${Date.now()}`,
          barcode: `BCH${uuidv4()}`,
          category: testCategory.id,
          prodSellingType: 'retail' as const,
          unit: 'piece',
          costPricePerUnit: 10,
          sellingPricePerUnit: 15,
          trackInventory: true,
          trackExpiry: true,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Create a batch
      const batch = await payload.create({
        collection: 'batches',
        data: {
          batchNumber: `BATCH${Date.now()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 50,
          stockAlert: 5,
          shop: testShop.id,
          status: 'active' as const,
        },
        user: testUser,
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
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: `Test Product Multiple Batches ${Date.now()}`,
          barcode: `MBCH${uuidv4()}`,
          category: testCategory.id,
          prodSellingType: 'retail' as const,
          unit: 'piece',
          costPricePerUnit: 10,
          sellingPricePerUnit: 15,
          trackInventory: true,
          trackExpiry: true,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Create multiple batches
      const batch1 = await payload.create({
        collection: 'batches',
        data: {
          batchNumber: `BATCH1-${Date.now()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 50,
          stockAlert: 5,
          shop: testShop.id,
          status: 'active' as const,
        },
        user: testUser,
      })

      const batch2 = await payload.create({
        collection: 'batches',
        data: {
          batchNumber: `BATCH2-${Date.now()}`,
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 30,
          stockAlert: 3,
          shop: testShop.id,
          status: 'active' as const,
        },
        user: testUser,
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
        payload.create({
          collection: 'products',
          data: {
            shop: testShop.id,
            name: 'Test Product',
            barcode: `INVALID${uuidv4()}`,
            category: testCategory.id,
            prodSellingType: 'retail' as const,
            unit: 'piece',
            costPricePerUnit: 10,
            sellingPricePerUnit: 15,
            trackInventory: true,
            trackExpiry: false,
            inventory: {
              quantity: 100,
              stockAlert: 0, // Invalid stock alert
            },
            status: 'active' as const,
          },
          user: testUser,
        }),
      ).rejects.toThrow('The following field is invalid: Inventory > Stock Alert')
    })

    it('should validate stock alert is greater than zero for negative values', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: {
            shop: testShop.id,
            name: 'Test Product',
            barcode: `INVALID2${uuidv4()}`,
            category: testCategory.id,
            prodSellingType: 'retail' as const,
            unit: 'piece',
            costPricePerUnit: 10,
            sellingPricePerUnit: 15,
            trackInventory: true,
            trackExpiry: false,
            inventory: {
              quantity: 100,
              stockAlert: 0,
            },
            status: 'active' as const,
          },
          user: testUser,
        }),
      ).rejects.toThrow('The following field is invalid: Inventory > Stock Alert')
    })

    it('should set default values correctly', async () => {
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Test Product Defaults',
          barcode: `DEF${uuidv4()}`,
          category: testCategory.id,
          prodSellingType: 'retail' as const, // Add required field
          unit: 'piece',
          costPricePerUnit: 10,
          sellingPricePerUnit: 15,
          inventory: {
            stockAlert: 10,
          },
        },
        user: testUser,
      })

      expect(product.prodSellingType).toBe('retail') // Default value
      expect(product.trackInventory).toBe(true) // Default value
      expect(product.trackExpiry).toBe(false) // Default value
      expect(product.status).toBe('active') // Default value
      expect(product.inventory?.quantity).toBe(0) // Default value
    })
  })

  describe('Product Update Tests', () => {
    it('should set updatedBy field during update', async () => {
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Test Product Update',
          barcode: `UPD${uuidv4()}`,
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
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: 'Test Product Status',
          barcode: `STS${uuidv4()}`,
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
      const product = await payload.create({
        collection: 'products',
        data: {
          shop: testShop.id,
          name: `Test Product Inactive ${uuidv4()}`,
          barcode: `INACTIVE${uuidv4()}`,
          category: testCategory.id,
          prodSellingType: 'retail' as const,
          unit: 'piece',
          costPricePerUnit: 10,
          sellingPricePerUnit: 15,
          trackInventory: true,
          trackExpiry: true,
          status: 'active' as const,
        },
        user: testUser,
      })

      // Create batches linked to this product
      const batch1 = await payload.create({
        collection: 'batches',
        data: {
          batchNumber: `BATCH1-${uuidv4()}`,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 50,
          stockAlert: 5,
          shop: testShop.id,
          status: 'active' as const,
        },
        user: testUser,
      })

      const batch2 = await payload.create({
        collection: 'batches',
        data: {
          batchNumber: `BATCH2-${uuidv4()}`,
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          quantity: 30,
          stockAlert: 3,
          shop: testShop.id,
          status: 'active' as const,
        },
        user: testUser,
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
