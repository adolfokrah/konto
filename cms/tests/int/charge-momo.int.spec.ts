import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { chargeMomo } from '../../src/collections/Contributions/endpoints/charge-momo'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

// Create the mock function using vi.hoisted for proper hoisting
const mockChargeMomo = vi.hoisted(() => vi.fn())

// Mock the Paystack service with hoisted mock
vi.mock('@/payload.config', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    paystack: {
      chargeMomo: mockChargeMomo,
    },
  }
})

let payload: Payload

describe('ChargeMomo Endpoint - Step by Step Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await clearAllCollections(payload)
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks() // Clear all mocks before each test

    // Set up default mock return for paystack
    mockChargeMomo.mockResolvedValue({
      status: true,
      data: { reference: 'test-ref-123', status: 'success' },
    })
  })

  it('should return 400 when contributionId is missing', async () => {
    // Create a mock request that matches the endpoint's expectations
    const mockRequest: any = {
      payload,
      data: {}, // Empty data - no contributionId
      user: { id: 'test-user-123' },
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Contribution ID is required',
    })
  })

  it('should return 404 when contribution does not exist', async () => {
    const mockRequest: any = {
      payload,
      data: { contributionId: 'non-existent-contribution-id' },
      user: { id: 'test-user-123' },
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(404)
    expect(responseData).toEqual({
      success: false,
      message: 'Contribution not found',
    })
  })

  it('should return 400 when contribution is not mobile money payment', async () => {
    // Create a test user and jar first
    const testUser = await payload.create({
      collection: 'users',
      data: {
        fullName: 'John Doe',
        phoneNumber: '+233541234567',
        country: 'gh',
        email: 'john.doe@example.com',
        password: 'testPassword123',
        isKYCVerified: true,
      },
    })

    const testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Jar',
        currency: 'GHS',
        creator: testUser.id,
        status: 'open',
      },
    })

    // Create a bank transfer contribution (not mobile money)
    const bankContribution = await payload.create({
      collection: 'contributions',
      data: {
        jar: testJar.id,
        collector: testUser.id,
        amountContributed: 50.0,
        paymentMethod: 'bank-transfer', // This is NOT mobile-money
        paymentStatus: 'pending',
        contributor: 'Jane Bank User',
        accountNumber: '1234567890', // Required for bank-transfer
        type: 'contribution',
      },
    })

    const mockRequest: any = {
      payload,
      data: { contributionId: bankContribution.id },
      user: testUser,
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Contribution is not a mobile money payment',
    })
  })

  it('should return 400 when contribution is already completed', async () => {
    // Create a test user and jar first
    const testUser = await payload.create({
      collection: 'users',
      data: {
        fullName: 'John Doe',
        phoneNumber: '+233541234567',
        country: 'gh',
        email: 'completed.user@example.com',
        password: 'testPassword123',
        isKYCVerified: true,
      },
    })

    const testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Jar',
        currency: 'GHS',
        creator: testUser.id,
        status: 'open',
      },
    })

    // Create a completed mobile money contribution
    const completedContribution = await payload.create({
      collection: 'contributions',
      data: {
        jar: testJar.id,
        collector: testUser.id,
        amountContributed: 100.0,
        paymentMethod: 'mobile-money',
        // Note: paymentStatus will be set to 'pending' by the setPaymentStatus hook
        contributorPhoneNumber: '+233541234567',
        mobileMoneyProvider: 'MTN',
        contributor: 'Jane Completed User',
        type: 'contribution',
      },
    })

    // Update the contribution to completed status (simulating a previously processed payment)
    await payload.update({
      collection: 'contributions',
      id: completedContribution.id,
      data: {
        paymentStatus: 'completed',
      },
    })

    const mockRequest: any = {
      payload,
      data: { contributionId: completedContribution.id },
      user: testUser,
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Contribution has already been processed successfully',
    })
  })

  it('should return 400 when collector email is missing', async () => {
    // Create a test user and jar first
    const testUser = await payload.create({
      collection: 'users',
      data: {
        fullName: 'John Doe',
        phoneNumber: '+233541234567',
        country: 'gh',
        email: 'collector.test@example.com',
        password: 'testPassword123',
        isKYCVerified: true,
      },
    })

    const testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Jar',
        currency: 'GHS',
        creator: testUser.id,
        status: 'open',
      },
    })

    // Create a valid mobile money contribution
    const validContribution = await payload.create({
      collection: 'contributions',
      data: {
        jar: testJar.id,
        collector: testUser.id,
        amountContributed: 75.0,
        paymentMethod: 'mobile-money',
        contributorPhoneNumber: '+233541234567',
        mobileMoneyProvider: 'MTN',
        contributor: 'Jane Valid User',
        type: 'contribution',
      },
    })

    // Create request with user missing email field
    const userWithoutEmail = { ...testUser, email: undefined }
    const mockRequest: any = {
      payload,
      data: { contributionId: validContribution.id },
      user: userWithoutEmail, // User without email
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData).toEqual({
      success: false,
      message: 'Collector email not found',
    })
  })

  it('should successfully process MTN mobile money charge', async () => {
    // Create a test user and jar first
    const testUser = await payload.create({
      collection: 'users',
      data: {
        fullName: 'John Doe',
        phoneNumber: '+233541234567',
        country: 'gh',
        email: 'success.test@example.com',
        password: 'testPassword123',
        isKYCVerified: true,
        paystackSubAccountCode: 'ACCT_TEST_123',
      },
    })

    const testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Success Jar',
        currency: 'GHS',
        creator: testUser.id,
        status: 'open',
      },
    })

    // Create a valid pending mobile money contribution
    const pendingContribution = await payload.create({
      collection: 'contributions',
      data: {
        jar: testJar.id,
        collector: testUser.id,
        amountContributed: 50.0,
        paymentMethod: 'mobile-money',
        contributorPhoneNumber: '+233541234567',
        mobileMoneyProvider: 'MTN',
        contributor: 'Jane Success User',
        type: 'contribution',
      },
    })

    // Fetch stored contribution to read calculated platform charge for expected transaction charge
    const storedContribution = await payload.findByID({
      collection: 'contributions',
      id: pendingContribution.id,
    })
    const expectedTransactionCharge = Math.round(
      (storedContribution as any)?.chargesBreakdown?.platformCharge * 100,
    )

    // Mock successful Paystack response
    mockChargeMomo.mockResolvedValue({
      status: true,
      data: {
        id: 12345,
        reference: `mtn-${pendingContribution.id}`,
        status: 'success',
        display_text: 'Transaction successful',
        amount: 5000, // 50 GHS in pesewas
        currency: 'GHS',
        gateway_response: 'Payment successful',
        message: 'Mobile money charge successful',
        created_at: '2025-08-28T14:05:00Z',
        channel: 'mobile_money',
      },
    })

    const mockRequest: any = {
      payload,
      data: { contributionId: pendingContribution.id },
      user: testUser,
    }

    const response = await chargeMomo(mockRequest)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData).toEqual({
      success: true,
      message: 'Mobile money charge initiated successfully',
      data: expect.objectContaining({
        id: 12345,
        reference: `mtn-${pendingContribution.id}`,
        status: 'success',
        amount: 5000,
        currency: 'GHS',
      }),
    })

    // Verify that Paystack was called with correct data
    expect(mockChargeMomo).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'success.test@example.com',
        amount: 5098, // 50.98 * 100 (contributor total amount including charges)
        currency: 'GHS', // Currency from jar (lowercase)
        phone: '+233541234567',
        provider: 'MTN',
        reference: pendingContribution.id,
        metadata: expect.objectContaining({
          description: 'Charge contribution for jar: Test Success Jar by collector: John Doe',
          contributionId: pendingContribution.id,
          jarId: testJar.id,
          contributorPhone: '+233541234567',
        }),
        subaccount: 'ACCT_TEST_123', // User’s withdrawal MoMo account
        bearer: 'subaccount',
        transaction_charge: expectedTransactionCharge,
      }),
    )
  })
})
