import { Payload } from 'payload'
import { v4 as uuidv4 } from 'uuid'
import type { User, Shop, Category, Product, Customer, Supplier, Service } from '@/payload-types'

export class TestFactory {
  constructor(private payload: Payload) {}

  async createUser(overrides: Partial<User> = {}): Promise<User> {
    return this.payload.create({
      collection: 'users',
      data: {
        email: `user-${uuidv4()}@test.com`,
        password: 'password123',
        fullName: `Test User ${uuidv4().slice(0, 8)}`,
        countryCode: '+233',
        phoneNumber: `12345${Math.floor(Math.random() * 10000)}`,
        role: 'vendor' as const,
        ...overrides,
      },
    })
  }

  async createShop(userId: string, overrides: Partial<Shop> = {}): Promise<Shop> {
    return this.payload.create({
      collection: 'shops',
      data: {
        name: `Test Shop ${uuidv4().slice(0, 8)}`,
        location: 'Test Location',
        owner: userId,
        shopType: 'retail' as const,
        shopCategory: 'grocery' as const,
        countryCode: '+233',
        contactNumber: `+233${Math.floor(Math.random() * 1000000000)}`,
        currency: 'GHS' as const,
        ...overrides,
      },
    })
  }

  async createCategory(overrides: Partial<Category> = {}): Promise<Category> {
    return this.payload.create({
      collection: 'categories',
      data: {
        name: `Test Category ${uuidv4().slice(0, 8)}`,
        ...overrides,
      },
    })
  }

  async createCustomer(overrides: Partial<Customer> = {}): Promise<Customer> {
    return this.payload.create({
      collection: 'customers',
      data: {
        name: `Test Customer ${uuidv4().slice(0, 8)}`,
        contactInfo: {
          email: `customer-${uuidv4().slice(0, 8)}@test.com`,
          phone: `+233${Math.floor(Math.random() * 1000000000)}`,
        },
        ...overrides,
      },
    })
  }

  async createSupplier(overrides: Partial<Supplier> = {}): Promise<Supplier> {
    return this.payload.create({
      collection: 'suppliers',
      data: {
        name: `Test Supplier ${uuidv4().slice(0, 8)}`,
        contactInfo: {
          email: `supplier-${uuidv4().slice(0, 8)}@test.com`,
          phone: `+233${Math.floor(Math.random() * 1000000000)}`,
        },
        ...overrides,
      },
    })
  }

  async createService(shopId: string, categoryId: string, overrides: Partial<Service> = {}): Promise<Service> {
    return this.payload.create({
      collection: 'services',
      data: {
        shop: shopId,
        category: categoryId,
        name: `Test Service ${uuidv4().slice(0, 8)}`,
        description: 'Test service description',
        price: 50,
        status: 'active' as const,
        ...overrides,
      },
    })
  }

  async createProduct(shopId: string, categoryId: string, user: User, overrides: Partial<Product> = {}): Promise<Product> {
    return this.payload.create({
      collection: 'products',
      data: {
        shop: shopId,
        name: `Test Product ${uuidv4().slice(0, 8)}`,
        barcode: `BC${uuidv4().slice(0, 8)}`,
        category: categoryId,
        prodSellingType: 'retail' as const,
        unit: 'piece',
        costPricePerUnit: 10,
        sellingPricePerUnit: 15,
        trackInventory: true,
        trackExpiry: true,
        status: 'active' as const,
        ...overrides,
      },
      user,
    })
  }

  async createBatch(shopId: string, user: User, overrides: Partial<any> = {}) {
    const defaultData = {
      shop: shopId,
      batchNumber: `BATCH${uuidv4().slice(0, 8)}`,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stockAlert: 10,
      status: 'active' as const,
      ...overrides,
    }

    return this.payload.create({
      collection: 'batches',
      data: defaultData,
      user,
    })
  }

  // Helper method to create a complete test setup
  async createCompleteSetup() {
    const user = await this.createUser()
    const shop = await this.createShop(user.id)
    const category = await this.createCategory()
    const product = await this.createProduct(shop.id, category.id, user)

    return { user, shop, category, product }
  }

  // Helper method to create a complete orders test setup
  async createOrdersTestSetup() {
    const user = await this.createUser()
    const shop = await this.createShop(user.id)
    const category = await this.createCategory()
    const customer = await this.createCustomer()
    const supplier = await this.createSupplier()
    const service = await this.createService(shop.id, category.id)

    const productWithoutExpiry = await this.createProduct(shop.id, category.id, user, {
      trackExpiry: false,
      inventory: { quantity: 100, stockAlert: 10 },
    })

    const productWithExpiry = await this.createProduct(shop.id, category.id, user, {
      trackExpiry: true,
      // Don't set inventory for expiry-tracked products - batches handle inventory
    })

    const batch = await this.createBatch(shop.id, user, {
      quantity: 50,
      stockAlert: 5,
      product: productWithExpiry.id,
    })

    // Update product to include batch
    const updatedProductWithExpiry = await this.payload.update({
      collection: 'products',
      id: productWithExpiry.id,
      data: {
        batches: [batch.id],
      },
    })

    return {
      user,
      shop,
      category,
      customer,
      supplier,
      service,
      productWithoutExpiry,
      productWithExpiry: updatedProductWithExpiry,
      batch,
    }
  }
}
