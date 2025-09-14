import { getPayload, Payload } from 'payload'
import { describe, it, beforeAll, expect, beforeEach, vi } from 'vitest'

import { verifyPayment } from '../../src/collections/Contributions/endpoints/verify-payment'
import { paystack } from '../../src/payload.config'
import config from '../../src/payload.config'
import { clearAllCollections } from '../utils/testCleanup'

describe('VerifyPayment Endpoint Integration Tests', () => {
  let payload: Payload
  let testUser: any
  let testJar: any

  beforeAll(async () => {
    payload = await getPayload({ config })
  })

  beforeEach(async () => {
    await clearAllCollections(payload)
    vi.clearAllMocks()

    // Create test user
    testUser = await payload.create({
      collection: 'users',
      data: {
        email: 'creator@test.com',
        password: 'password123',
        fullName: 'Creator User',
        phoneNumber: '+233500000001',
        country: 'gh',
        accountNumber: '0244123456',
        bank: 'mtn',
        accountHolder: 'Creator User',
        isKYCVerified: true,
      },
    })

    // Create test jar
    testJar = await payload.create({
      collection: 'jars',
      data: {
        name: 'Test Verify Jar',
        creator: testUser.id,
        currency: 'GHS',
        status: 'open',
        isActive: true,

        acceptAnonymousContributions: false,
        isFixedContribution: false,
        goalAmount: 0,
      },
    })
  })

  describe('POST /api/contributions/verify-payment - Core Tests', () => {
    it('should return 400 when reference is missing', async () => {
      const mockRequest: any = {
        data: {},
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.message).toBe('Reference is required')
    })

    it('should return 404 when contribution with reference is not found', async () => {
      // Mock successful Paystack response but no matching contribution
      vi.spyOn(paystack, 'checkTransactionStatus').mockResolvedValue({
        status: true,
        data: { status: 'success', amount: 100000, currency: 'GHS' },
        message: 'Transaction verified successfully',
      })

      const mockRequest: any = {
        data: { reference: 'non-existent-ref' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.message).toBe('Contribution not found')
    })

    it('should return 400 when Paystack transaction verification fails', async () => {
      // Create a test contribution
      const testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: testUser.id,
          contributorPhoneNumber: '+233500000002',
          amountContributed: 100,
          paymentMethod: 'mobile-money',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
          transactionReference: 'failed-ref-123',
          paymentStatus: 'pending',
          isTransferred: false,
          collector: testUser.id,
        },
      })

      // Mock failed Paystack response
      vi.spyOn(paystack, 'checkTransactionStatus').mockResolvedValue({
        status: false,
        data: { status: 'failed' },
        message: 'Transaction verification failed',
      })

      const mockRequest: any = {
        data: { reference: 'failed-ref-123' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Transaction verification failed')
    })

    it('should successfully verify payment for regular contribution', async () => {
      // Create a test contribution with a contributor
      const testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: testUser.id,
          contributorPhoneNumber: '+233500000003',
          amountContributed: 100,
          paymentMethod: 'mobile-money',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
          transactionReference: 'success-ref-123',
          paymentStatus: 'pending',
          isTransferred: false,
          collector: testUser.id,
        },
      })

      // Mock successful Paystack response
      vi.spyOn(paystack, 'checkTransactionStatus').mockResolvedValue({
        status: true,
        data: { status: 'success', amount: 100000, currency: 'GHS' },
        message: 'Transaction verified successfully',
      })

      const mockRequest: any = {
        data: { reference: 'success-ref-123' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Transaction verified successfully')

      // Verify contribution status was updated
      const updatedContribution = await payload.findByID({
        collection: 'contributions',
        id: testContribution.id,
      })
      expect(updatedContribution.paymentStatus).toBe('completed')
    })

    it('should handle errors gracefully', async () => {
      // Create a test contribution
      const testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: testUser.id,
          contributorPhoneNumber: '+233500000006',
          amountContributed: 100,
          paymentMethod: 'mobile-money',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
          transactionReference: 'error-ref-123',
          paymentStatus: 'pending',
          isTransferred: false,
          collector: testUser.id,
        },
      })

      // Mock Paystack to throw an error
      vi.spyOn(paystack, 'checkTransactionStatus').mockRejectedValue(new Error('Network error'))

      const mockRequest: any = {
        data: { reference: 'error-ref-123' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Failed to verify payment')
      expect(responseData.error).toBe('Paystack API failed: Network error')
    })

    it('should handle failed verification with fallback message', async () => {
      // Create a test contribution
      const testContribution = await payload.create({
        collection: 'contributions',
        data: {
          jar: testJar.id,
          contributor: testUser.id,
          contributorPhoneNumber: '+233500000007',
          amountContributed: 100,
          paymentMethod: 'mobile-money',
          mobileMoneyProvider: 'mtn',
          type: 'contribution' as const,
          transactionReference: 'fallback-ref-123',
          paymentStatus: 'pending',
          isTransferred: false,
          collector: testUser.id,
        },
      })

      // Mock Paystack response with empty message to test fallback
      vi.spyOn(paystack, 'checkTransactionStatus').mockResolvedValue({
        status: false,
        data: { status: 'failed' },
        message: '',
      })

      const mockRequest: any = {
        data: { reference: 'fallback-ref-123' },
        payload,
      }

      const response = await verifyPayment(mockRequest)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.message).toBe('Transaction verification failed')
    })
  })
})
