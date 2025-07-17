import type { Product, Shop, User } from '@/payload-types'
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

describe('Expenses Collection Integration Tests - Simple', () => {
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
    })
  })

  afterEach(async () => {
    await clearAllCollections(payload)
  })

  describe('Basic Tests', () => {
    it('should successfully create a simple non-inventory expense', async () => {
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Office supplies expense',
          type: 'office-supplies',
          amount: 50.0,
          payment: 'paid',
          paymentMethod: 'cash',
          notes: 'Basic office supplies',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.description).toBe('Office supplies expense')
      expect(expense.amount).toBe(50.0)
      expect(expense.type).toBe('office-supplies')
      expect(expense.payment).toBe('paid')
      expect(typeof expense.shop === 'string' ? expense.shop : expense.shop?.id).toBe(testShop.id)
    })

    it('should successfully create an inventory expense with product items', async () => {
      // Get initial product quantity for comparison
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Product purchase for inventory',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id,
              quantity: 10,
              cost: 25.0,
            },
          ],
          notes: 'Inventory purchase',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.description).toBe('Product purchase for inventory')
      expect(expense.type).toBe('inventory')
      expect(expense.updateStock).toBe(true)
      expect(expense.payment).toBe('paid')
      expect(expense.items).toBeDefined()
      expect(expense.items).toHaveLength(1)
      expect(expense.items![0].quantity).toBe(10)
      expect(expense.items![0].cost).toBe(25.0)
      expect(
        typeof expense.items![0].product === 'string'
          ? expense.items![0].product
          : expense.items![0].product?.id
      ).toBe(testProduct.id)
      expect(typeof expense.shop === 'string' ? expense.shop : expense.shop?.id).toBe(testShop.id)

      // Verify that stock record was created
      const stockRecords = await payload.find({
        collection: 'stock',
        where: {
          expenseReference: {
            equals: expense.id,
          },
        },
      })

      expect(stockRecords.docs).toHaveLength(1)
      expect(stockRecords.docs[0].type).toBe('purchase')
      expect(stockRecords.docs[0].quantity).toBe(10)
      expect(
        typeof stockRecords.docs[0].product === 'string'
          ? stockRecords.docs[0].product
          : stockRecords.docs[0].product?.id
      ).toBe(testProduct.id)

      // Verify that product quantity has been updated correctly
      const updatedProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })

      // Since this product doesn't track expiry, the quantity should be updated in product.inventory.quantity
      expect(updatedProduct.inventory?.quantity).toBe(initialQuantity + 10)
    })

    it('should test setProductAndBatchMetadata hook functionality', async () => {
      // Create a product with expiry tracking
      const productWithExpiry = await factory.createProduct(
        testShop.id,
        testProduct.category as string,
        testUser,
        {
          name: 'Product with Expiry',
          trackExpiry: true,
          trackInventory: true,
        }
      )

      // Create a batch for the product
      const batch = await factory.createBatch(testShop.id, testUser, {
        batchNumber: 'BATCH001',
        product: productWithExpiry.id,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        stockAlert: 5,
        status: 'active',
      })

      // Get initial batch quantity for comparison
      const initialBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })
      const initialBatchQuantity = initialBatch.quantity || 0

      // Create expense with product and batch - should populate metadata
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Inventory purchase with batch',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: productWithExpiry.id,
              batch: batch.id,
              quantity: 5,
              cost: 30.0,
            },
          ],
          notes: 'Testing metadata population',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.items).toBeDefined()
      expect(expense.items).toHaveLength(1)

      // Check that productMetadataAtPurchase was populated
      expect(expense.items![0].productMetadataAtPurchase).toBeDefined()
      const productMetadata = expense.items![0].productMetadataAtPurchase as any
      expect(productMetadata.name).toBe(productWithExpiry.name)
      expect(productMetadata.trackExpiry).toBe(true)

      // Check that batchMetadataAtPurchase was populated for expiry-tracked product
      expect(expense.items![0].batchMetadataAtPurchase).toBeDefined()
      const batchMetadata = expense.items![0].batchMetadataAtPurchase as any
      expect(batchMetadata.batchNumber).toBe('BATCH001')
      expect(batchMetadata.id).toBe(batch.id)

      // Verify that batch quantity has been updated correctly
      const updatedBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })

      // Since this product tracks expiry, the quantity should be updated in the batch
      expect(updatedBatch.quantity).toBe(initialBatchQuantity + 5)
    })

    it('should not update quantities when updateStock is false', async () => {
      // Get initial product quantity for comparison
      const initialProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialQuantity = initialProduct.inventory?.quantity || 0

      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Product purchase without stock update',
          type: 'inventory',
          updateStock: false, // Don't update stock
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id,
              quantity: 10,
              cost: 25.0,
            },
          ],
          notes: 'Inventory purchase without stock update',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.updateStock).toBe(false)

      // Verify that no stock record was created
      const stockRecords = await payload.find({
        collection: 'stock',
        where: {
          expenseReference: {
            equals: expense.id,
          },
        },
      })

      expect(stockRecords.docs).toHaveLength(0)

      // Verify that product quantity has NOT been updated
      const updatedProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })

      expect(updatedProduct.inventory?.quantity).toBe(initialQuantity)
    })

    it('should handle mixed expense with both expiry and non-expiry products', async () => {
      // Create a product with expiry tracking
      const productWithExpiry = await factory.createProduct(
        testShop.id,
        testProduct.category as string,
        testUser,
        {
          name: 'Product with Expiry Mixed',
          trackExpiry: true,
          trackInventory: true,
        }
      )

      // Create a batch for the expiry product
      const batch = await factory.createBatch(testShop.id, testUser, {
        batchNumber: 'BATCH002',
        product: productWithExpiry.id,
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        stockAlert: 3,
        status: 'active',
      })

      // Get initial quantities for comparison
      const initialNoExpiryProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      const initialNoExpiryQuantity = initialNoExpiryProduct.inventory?.quantity || 0

      const initialBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })
      const initialBatchQuantity = initialBatch.quantity || 0

      // Create expense with mixed product types
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Mixed inventory purchase',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id, // No expiry tracking
              quantity: 15,
              cost: 20.0,
            },
            {
              product: productWithExpiry.id, // With expiry tracking
              batch: batch.id,
              quantity: 8,
              cost: 35.0,
            },
          ],
          notes: 'Testing mixed product types',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.items).toBeDefined()
      expect(expense.items).toHaveLength(2)

      // Verify first item (no expiry)
      expect(expense.items![0].quantity).toBe(15)
      expect(expense.items![0].cost).toBe(20.0)
      expect(
        typeof expense.items![0].product === 'string'
          ? expense.items![0].product
          : expense.items![0].product?.id
      ).toBe(testProduct.id)

      // Verify second item (with expiry)
      expect(expense.items![1].quantity).toBe(8)
      expect(expense.items![1].cost).toBe(35.0)
      expect(
        typeof expense.items![1].product === 'string'
          ? expense.items![1].product
          : expense.items![1].product?.id
      ).toBe(productWithExpiry.id)
      expect(
        typeof expense.items![1].batch === 'string'
          ? expense.items![1].batch
          : expense.items![1].batch?.id
      ).toBe(batch.id)

      // Check metadata for both items
      // First item (no expiry) - should have product metadata but no batch metadata
      expect(expense.items![0].productMetadataAtPurchase).toBeDefined()
      const productMetadata1 = expense.items![0].productMetadataAtPurchase as any
      expect(productMetadata1.name).toBe(testProduct.name)
      expect(productMetadata1.trackExpiry).toBe(false)
      expect(expense.items![0].batchMetadataAtPurchase).toBeNull()

      // Second item (with expiry) - should have both product and batch metadata
      expect(expense.items![1].productMetadataAtPurchase).toBeDefined()
      const productMetadata2 = expense.items![1].productMetadataAtPurchase as any
      expect(productMetadata2.name).toBe(productWithExpiry.name)
      expect(productMetadata2.trackExpiry).toBe(true)

      expect(expense.items![1].batchMetadataAtPurchase).toBeDefined()
      const batchMetadata = expense.items![1].batchMetadataAtPurchase as any
      expect(batchMetadata.batchNumber).toBe('BATCH002')
      expect(batchMetadata.id).toBe(batch.id)

      // Verify that stock records were created for both items
      const stockRecords = await payload.find({
        collection: 'stock',
        where: {
          expenseReference: {
            equals: expense.id,
          },
        },
      })

      expect(stockRecords.docs).toHaveLength(2)

      // Check stock record for non-expiry product
      const noExpiryStockRecord = stockRecords.docs.find(
        record =>
          (typeof record.product === 'string' ? record.product : record.product?.id) ===
          testProduct.id
      )
      expect(noExpiryStockRecord).toBeDefined()
      expect(noExpiryStockRecord!.type).toBe('purchase')
      expect(noExpiryStockRecord!.quantity).toBe(15)
      expect(noExpiryStockRecord!.batch).toBeNull()

      // Check stock record for expiry product
      const expiryStockRecord = stockRecords.docs.find(
        record =>
          (typeof record.product === 'string' ? record.product : record.product?.id) ===
          productWithExpiry.id
      )
      expect(expiryStockRecord).toBeDefined()
      expect(expiryStockRecord!.type).toBe('purchase')
      expect(expiryStockRecord!.quantity).toBe(8)
      expect(expiryStockRecord!.batch).toBe(batch.id)

      // Verify quantity updates
      // Check non-expiry product quantity update
      const updatedNoExpiryProduct = await payload.findByID({
        collection: 'products',
        id: testProduct.id,
      })
      expect(updatedNoExpiryProduct.inventory?.quantity).toBe(initialNoExpiryQuantity + 15)

      // Check batch quantity update for expiry product
      const updatedBatch = await payload.findByID({
        collection: 'batches',
        id: batch.id,
      })
      expect(updatedBatch.quantity).toBe(initialBatchQuantity + 8)
    })

    it('should handle setProductAndBatchMetadata for product without expiry tracking', async () => {
      // Create expense with product without expiry tracking - should not populate batch metadata
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Inventory purchase without batch',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id, // This product has trackExpiry: false
              quantity: 8,
              cost: 20.0,
            },
          ],
          notes: 'Testing without batch',
        },
      })

      expect(expense).toBeDefined()
      expect(expense.items).toBeDefined()
      expect(expense.items).toHaveLength(1)

      // Check that productMetadataAtPurchase was populated
      expect(expense.items![0].productMetadataAtPurchase).toBeDefined()
      const productMetadata = expense.items![0].productMetadataAtPurchase as any
      expect(productMetadata.name).toBe(testProduct.name)
      expect(productMetadata.trackExpiry).toBe(false)

      // Check that batchMetadataAtPurchase is null for non-expiry-tracked product
      expect(expense.items![0].batchMetadataAtPurchase).toBeNull()
    })

    it('should throw error when product is not found in setProductAndBatchMetadata', async () => {
      const nonExistentProductId = '507f1f77bcf86cd799439011' // Valid ObjectId format but doesn't exist

      await expect(
        payload.create({
          collection: 'expenses',
          data: {
            date: new Date().toISOString(),
            shop: testShop.id,
            description: 'Expense with invalid product',
            type: 'inventory',
            updateStock: true,
            payment: 'paid',
            paymentMethod: 'cash',
            items: [
              {
                product: nonExistentProductId,
                quantity: 5,
                cost: 25.0,
              },
            ],
          },
        })
      ).rejects.toThrow('Product not found')
    })

    it('should prevent changing expense type after creation', async () => {
      // First create an inventory expense
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Original inventory expense',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id,
              quantity: 3,
              cost: 15.0,
            },
          ],
        },
      })

      // Try to update and change the type - should throw error
      await expect(
        payload.update({
          collection: 'expenses',
          id: expense.id,
          data: {
            type: 'office-supplies', // Changing from inventory to office-supplies
            amount: 100.0,
          },
        })
      ).rejects.toThrow('Cannot change the type of an expense')
    })

    it('should prevent changing number of items in inventory expense', async () => {
      // First create an inventory expense with one item
      const expense = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Original inventory expense',
          type: 'inventory',
          updateStock: true,
          payment: 'paid',
          paymentMethod: 'cash',
          items: [
            {
              product: testProduct.id,
              quantity: 3,
              cost: 15.0,
            },
          ],
        },
      })

      // Try to update and add more items - should throw error
      await expect(
        payload.update({
          collection: 'expenses',
          id: expense.id,
          data: {
            items: [
              {
                product: testProduct.id,
                quantity: 3,
                cost: 15.0,
              },
              {
                product: testProduct.id,
                quantity: 2,
                cost: 10.0,
              },
            ],
          },
        })
      ).rejects.toThrow('Cannot change the number of items in an expense')
    })

    it('should validate amountPaid correctly when payment is partial', async () => {
      // Test case 1: Valid partial payment
      const expense1 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Partial payment test',
          type: 'inventory',
          updateStock: true,
          payment: 'partial',
          paymentMethod: 'cash',
          amountPaid: 50.0, // Paying 50 out of 75 total (3 * 25)
          fullAmountDueOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          items: [
            {
              product: testProduct.id,
              quantity: 3,
              cost: 25.0, // Unit cost: 25, Total: 3 * 25 = 75
            },
          ],
        },
      })

      expect(expense1).toBeDefined()
      expect(expense1.payment).toBe('partial')
      expect(expense1.amountPaid).toBe(50.0)

      // Test case 2: Amount paid equals total - should automatically set to 'paid'
      const expense2 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Full payment via partial field test',
          type: 'inventory',
          updateStock: true,
          payment: 'partial',
          paymentMethod: 'cash',
          amountPaid: 100.0, // Paying full amount (4 * 25)
          fullAmountDueOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product: testProduct.id,
              quantity: 4,
              cost: 25.0, // Unit cost: 25, Total: 4 * 25 = 100
            },
          ],
        },
      })

      expect(expense2).toBeDefined()
      expect(expense2.payment).toBe('paid') // Should be automatically set to 'paid'
      expect(expense2.amountPaid).toBe(100.0)

      // Test case 3: Amount paid exceeds total - should throw error
      await expect(
        payload.create({
          collection: 'expenses',
          data: {
            date: new Date().toISOString(),
            shop: testShop.id,
            description: 'Overpayment test',
            type: 'inventory',
            updateStock: true,
            payment: 'partial',
            paymentMethod: 'cash',
            amountPaid: 150.0, // Paying more than total (4 * 25 = 100)
            fullAmountDueOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: [
              {
                product: testProduct.id,
                quantity: 4,
                cost: 25.0, // Unit cost: 25, Total: 4 * 25 = 100
              },
            ],
          },
        })
      ).rejects.toThrow('Amount paid cannot be greater than order amount of 100')
    })

    it('should validate amountPaid for non-inventory expenses', async () => {
      // Test case 1: Valid partial payment for non-inventory expense
      const expense1 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Office supplies partial payment',
          type: 'office-supplies',
          amount: 200.0,
          payment: 'partial',
          paymentMethod: 'cash',
          amountPaid: 120.0, // Paying 120 out of 200
          fullAmountDueOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        },
      })

      expect(expense1).toBeDefined()
      expect(expense1.payment).toBe('partial')
      expect(expense1.amountPaid).toBe(120.0)
      expect(expense1.amount).toBe(200.0)

      // Test case 2: Full payment via partial field - should set to 'paid'
      const expense2 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Utilities full payment via partial',
          type: 'utilities',
          amount: 300.0,
          payment: 'partial',
          paymentMethod: 'bank-transfer',
          amountPaid: 300.0, // Full amount
          fullAmountDueOn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })

      expect(expense2).toBeDefined()
      expect(expense2.payment).toBe('paid') // Should be automatically set to 'paid'
      expect(expense2.amountPaid).toBe(300.0)

      // Test case 3: Overpayment - should throw error
      await expect(
        payload.create({
          collection: 'expenses',
          data: {
            date: new Date().toISOString(),
            shop: testShop.id,
            description: 'Equipment overpayment',
            type: 'equipment',
            amount: 500.0,
            payment: 'partial',
            paymentMethod: 'card',
            amountPaid: 600.0, // More than amount
            fullAmountDueOn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
        })
      ).rejects.toThrow('Amount paid cannot be greater than order amount of 500')
    })

    it('should validate amountPaid with multiple inventory items', async () => {
      // Create another product for testing multiple items
      const secondProduct = await factory.createProduct(
        testShop.id,
        testProduct.category as string,
        testUser,
        {
          name: 'Second Test Product',
          trackExpiry: false,
          trackInventory: true,
        }
      )

      // Test case 1: Valid partial payment with multiple items
      const expense1 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Multi-item partial payment',
          type: 'inventory',
          updateStock: true,
          payment: 'partial',
          paymentMethod: 'cash',
          amountPaid: 180.0, // Paying 180 out of 225 total (3*25 + 5*30 = 75+150)
          fullAmountDueOn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product: testProduct.id,
              quantity: 3,
              cost: 25.0, // Unit cost: 25, Total: 3 * 25 = 75
            },
            {
              product: secondProduct.id,
              quantity: 5,
              cost: 30.0, // Unit cost: 30, Total: 5 * 30 = 150
            },
          ], // Total: 75 + 150 = 225
        },
      })

      expect(expense1).toBeDefined()
      expect(expense1.payment).toBe('partial')
      expect(expense1.amountPaid).toBe(180.0)

      // Test case 2: Full payment with multiple items - should set to 'paid'
      const expense2 = await payload.create({
        collection: 'expenses',
        data: {
          date: new Date().toISOString(),
          shop: testShop.id,
          description: 'Multi-item full payment',
          type: 'inventory',
          updateStock: true,
          payment: 'partial',
          paymentMethod: 'card',
          amountPaid: 280.0, // Full amount (4*30 + 8*20 = 120+160)
          fullAmountDueOn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          items: [
            {
              product: testProduct.id,
              quantity: 4,
              cost: 30.0, // Unit cost: 30, Total: 4 * 30 = 120
            },
            {
              product: secondProduct.id,
              quantity: 8,
              cost: 20.0, // Unit cost: 20, Total: 8 * 20 = 160
            },
          ], // Total: 120 + 160 = 280
        },
      })

      expect(expense2).toBeDefined()
      expect(expense2.payment).toBe('paid') // Should be automatically set to 'paid'
      expect(expense2.amountPaid).toBe(280.0)

      // Test case 3: Overpayment with multiple items - should throw error
      await expect(
        payload.create({
          collection: 'expenses',
          data: {
            date: new Date().toISOString(),
            shop: testShop.id,
            description: 'Multi-item overpayment',
            type: 'inventory',
            updateStock: true,
            payment: 'partial',
            paymentMethod: 'mobile-money',
            amountPaid: 350.0, // More than total (2*40 + 6*30 = 80+180 = 260)
            fullAmountDueOn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            items: [
              {
                product: testProduct.id,
                quantity: 2,
                cost: 40.0, // Unit cost: 40, Total: 2 * 40 = 80
              },
              {
                product: secondProduct.id,
                quantity: 6,
                cost: 30.0, // Unit cost: 30, Total: 6 * 30 = 180
              },
            ], // Total: 80 + 180 = 260
          },
        })
      ).rejects.toThrow('Amount paid cannot be greater than order amount of 260')
    })
  })
})
